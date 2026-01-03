import { z } from 'genkit';

// Define the structure for the TaskHistory using Zod for validation
export const TaskHistorySchema = z.object({
    taskId: z.string(),
    date: z.string(),
    taskType: z.enum(['group', 'personal']),
});

// === Progress Analysis Schemas ===

export const ProgressAnalysisInputSchema = z.object({
  goals: z.string().optional().describe("The user's long-term goals."),
  habits: z.string().optional().describe("The user's desired daily/weekly habits."),
  taskHistory: z.array(TaskHistorySchema).describe("The user's recent task completion history."),
});
export type ProgressAnalysisInput = z.infer<typeof ProgressAnalysisInputSchema>;

export const ProgressAnalysisOutputSchema = z.object({
  text: z.string().describe("A short, insightful, and motivational analysis of the user's progress. Max 2-3 sentences."),
});
export type ProgressAnalysisOutput = z.infer<typeof ProgressAnalysisOutputSchema>;


// === Create Task Chat Schemas ===

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const CreateTaskChatInputSchema = z.object({
  userId: z.string().describe("The ID of the user creating the task."),
  history: z.array(ChatMessageSchema).describe("The conversation history so far."),
});
export type CreateTaskChatInput = z.infer<typeof CreateTaskChatInputSchema>;

export const CreateTaskChatOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user."),
  isTaskCreated: z.boolean().describe("True if the task was successfully created in this turn."),
});
export type CreateTaskChatOutput = z.infer<typeof CreateTaskChatOutputSchema>;
