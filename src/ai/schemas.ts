import { z } from 'genkit/zod';

// Note: No 'use server' here. This file just defines data structures.

export const ChatInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.object({ text: z.string() })),
      })
    )
    .optional(),
  message: z.string(),
});

export const ChatOutputSchema = z.object({
  reply: z.string().describe("The assistant's response."),
});
