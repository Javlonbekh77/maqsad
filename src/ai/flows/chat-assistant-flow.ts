'use server';

/**
 * Chat assistant using Groq AI backend.
 * This implementation keeps the same `ChatInput`/`ChatOutput` shapes
 * but calls a configurable Groq HTTP endpoint using `GROQ_API_KEY`.
 */

import { z } from 'zod';
import { ChatInputSchema, ChatOutputSchema } from '../schemas';
import { Groq } from 'groq-sdk';
import { getPersonalTasksForUser, getUser, getScheduledTasksForUser } from '@/lib/data';

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `
You are a helpful and friendly productivity assistant for the "MaqsadM" app.

Your responsibilities:
- Help users clarify their goals
- Suggest actionable tasks
- Break big goals into smaller steps
- Ask short clarifying questions when needed
- Be motivating and practical

Rules:
- Keep responses concise and actionable
- Always respond in the user's language
- Always use Markdown formatting
- Do NOT include unnecessary explanations

Today's date: ${new Date().toLocaleDateString()}
`;

function buildPrompt(history: { role: 'user' | 'model'; parts: { text: string }[] }[] | undefined, message: string) {
  const lines: string[] = [];
  lines.push(systemPrompt.trim());
  lines.push('');

  if (history?.length) {
    for (const msg of history) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const text = msg.parts.map(p => p.text).join('\n');
      lines.push(`${role}: ${text}`);
    }
  }

  lines.push(`User: ${message}`);
  lines.push('Assistant:');

  return lines.join('\n\n');
}

async function extractReplyFromGroqResponse(json: any): Promise<string | null> {
  // Try common shapes returned by LLM endpoints. Fallback to stringified output.
  try {
    if (!json) return null;
    // Some APIs: json.output[0].content[0].text
    if (json.output && Array.isArray(json.output)) {
      for (const out of json.output) {
        if (out.content && Array.isArray(out.content)) {
          for (const c of out.content) {
            if (typeof c.text === 'string' && c.text.trim()) return c.text.trim();
            if (typeof c === 'string' && c.trim()) return c.trim();
            if (c.type === 'output_text' && typeof c.text === 'string') return c.text.trim();
          }
        }
        if (typeof out === 'string' && out.trim()) return out.trim();
      }
    }
    // Some APIs: json.choices[0].message.content or json.choices[0].text
    if (json.choices && Array.isArray(json.choices)) {
      const ch = json.choices[0];
      if (ch) {
        if (ch.message && ch.message.content) return String(ch.message.content).trim();
        if (typeof ch.text === 'string') return ch.text.trim();
      }
    }

    // As last resort try common fields
    if (typeof json.text === 'string') return json.text.trim();

    // Give up and return serialized JSON so the caller sees something useful
    return JSON.stringify(json);
  } catch (e) {
    return null;
  }
}

export async function chatAssistant(input: ChatInput): Promise<ChatOutput> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (input.history?.length) {
    for (const msg of input.history) {
      const role = msg.role === 'model' ? 'assistant' : msg.role; // map 'model' -> 'assistant'
      messages.push({ role, content: msg.parts.map(p => p.text).join('\n') });
    }
  }
  // Prepend system prompt as a system message so the model receives instructions
  messages.unshift({ role: 'system', content: systemPrompt.trim() });

  // Fetch and include complete user profile data in every message
  if (input.userId) {
    try {
      const user = await getUser(input.userId);
      if (user) {
        const personal = await getPersonalTasksForUser(input.userId);
        const scheduled = user ? await getScheduledTasksForUser(user) : [];
        const combined = [...(personal || []), ...(scheduled || [])];

        // Calculate task statistics
        const completedCount = (user.taskHistory || []).length;
        const totalTasks = combined.length;
        const inProgressCount = totalTasks - (combined.filter(t => {
          const hist = (user.taskHistory || []).find(h => h.taskId === t.id);
          return !!hist;
        }).length || 0);

        // Build comprehensive user profile
        const userProfile = `
USER PROFILE - IMPORTANT: Personalize your responses using this data:
- Name: ${user.fullName || user.firstName + ' ' + user.lastName}
- Goals: ${user.goals || 'Not specified'}
- Habits: ${user.habits || 'Not specified'}
- Gold Coins: ${user.coins || 0}
- Silver Coins: ${user.silverCoins || 0}
- Total Tasks Created: ${totalTasks}
- Tasks Completed: ${completedCount}
- Tasks In Progress: ${inProgressCount}
- Completion Rate: ${totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%
- Groups: ${user.groups?.length || 0}
- Occupation: ${user.occupation || 'Not specified'}
- University: ${user.university || 'Not specified'}
- Course: ${user.course || 'Not specified'}

CURRENT ACTIVE TASKS (Top 15):
${combined.slice(0, 15).map((t, i) => {
  const title = t.title || 'No title';
  const desc = (t as any).description ? (t as any).description.substring(0, 80).replace(/\n/g, ' ') : '';
  const type = (t as any).taskType || (t as any).groupId ? 'group' : 'personal';
  const completed = (user.taskHistory || []).some(h => h.taskId === t.id) ? '✓ DONE' : '○ TODO';
  return `${i + 1}. [${completed}] ${title} (${type}) - ${desc}`;
}).join('\n')}

CONTEXT: User's profile is loaded above. Base all responses on their actual data - their current progress, goals, habits, and task responsibilities. Be encouraging, practical, and align advice with their situation.`;

        // Insert user profile as system message after main prompt
        messages.splice(1, 0, { role: 'system', content: userProfile });
      }
    } catch (e) {
      console.error('Error fetching user profile for context', e);
    }
  }

  messages.push({ role: 'user', content: input.message });

  // Use a sensible default model; you can change via env var if you prefer.
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  const completion = await groq.chat.completions.create({
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    model,
    temperature: 0.7,
    max_completion_tokens: 1024,
    stream: false,
  });

  // completion may contain different shapes depending on the SDK/version.
  // Try to extract a sensible reply from common fields.
  let reply: string | null = null;
  try {
    if ((completion as any).choices && Array.isArray((completion as any).choices)) {
      const ch = (completion as any).choices[0];
      // typical: ch.message.content
      if (ch?.message?.content) reply = String(ch.message.content).trim();
      // or ch.text
      if (!reply && typeof ch?.text === 'string') reply = ch.text.trim();
      // or incremental deltas
      if (!reply && ch?.delta?.content) reply = String(ch.delta.content).trim();
    }

    // Some responses put text at top-level
    if (!reply && typeof (completion as any).text === 'string') reply = (completion as any).text.trim();

    // fallback: try output array
    if (!reply && (completion as any).output && Array.isArray((completion as any).output)) {
      for (const out of (completion as any).output) {
        if (typeof out === 'string' && out.trim()) { reply = out.trim(); break; }
        if (out?.content && Array.isArray(out.content)) {
          for (const c of out.content) {
            if (typeof c.text === 'string' && c.text.trim()) { reply = c.text.trim(); break; }
          }
          if (reply) break;
        }
      }
    }
  } catch (e) {
    // ignore and fall through to final check
  }

  if (!reply) {
    // As last resort, serialize the completion so the client gets something useful
    reply = JSON.stringify(completion);
  }

  return { reply };
}
