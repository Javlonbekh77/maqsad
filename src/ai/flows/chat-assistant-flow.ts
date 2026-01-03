'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { ChatInputSchema, ChatOutputSchema } from '../schemas';

export type ChatHistory = z.infer<typeof ChatInputSchema>['history'];

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chatAssistant(input: ChatInput): Promise<ChatOutput> {
  return chatAssistantFlow(input);
}

const systemPrompt = `You are a helpful and friendly productivity assistant for the 'MaqsadM' app.
Your goal is to help the user decide what to do.
You can suggest tasks, ask clarifying questions about their goals, and help them break down larger goals into smaller, manageable tasks.
Keep your responses concise, actionable, and encouraging.
The current date is ${new Date().toLocaleDateString()}.
If the user's message is not in English, please respond in the language of the user's message.
Always format your response using Markdown.
`;

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      messages: [
        { role: 'system', parts: [{ text: systemPrompt }] },
        ...(input.history || []),
        { role: 'user', parts: [{ text: input.message }] },
      ],
      output: {
        schema: ChatOutputSchema,
      },
      config: {
        temperature: 0.7,
      },
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("Failed to get a response from the AI model.");
    }
    return output;
  }
);