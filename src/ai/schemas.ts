import { z } from 'genkit';

// === Progress Analysis Schemas ===
// This functionality has been removed in favor of the AI Chat Assistant.

// === AI Chat Assistant Schemas ===

export const ChatHistorySchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatHistory = z.infer<typeof ChatHistorySchema>;


export const ChatAssistantInputSchema = z.object({
  userId: z.string().describe("The ID of the user."),
  history: z.array(ChatHistorySchema).describe("The conversation history so far."),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

export const ChatAssistantOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user."),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;
