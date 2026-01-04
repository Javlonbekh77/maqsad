'use server';

/**
 * @fileOverview AI productivity assistant for MaqsadM
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ChatInputSchema, ChatOutputSchema } from '../schemas';

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

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

// Define a type for the messages array that matches Gemini's expectations
type GeminiMessage = {
  role: 'user' | 'model';
  content: { text: string }[];
};

export async function chatAssistant(input: ChatInput): Promise<ChatOutput> {
  const messages: GeminiMessage[] = [];

  // Safely add chat history
  if (input.history?.length) {
    for (const msg of input.history) {
      messages.push({
        role: msg.role,
        content: msg.parts.map(p => ({ text: p.text })),
      });
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: [{ text: input.message }],
  });

  const response = await ai.generate({
    model: 'googleai/gemini-1.5-flash-latest',
    system: systemPrompt, // Use the dedicated 'system' field for the system prompt
    messages: messages,  // Pass the user/model message history
    output: {
      schema: ChatOutputSchema,
    },
    config: {
      temperature: 0.7,
    },
  });

  if (!response.output) {
    throw new Error('AI did not return a valid response');
  }

  return response.output;
}
