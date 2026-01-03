'use server';
/**
 * @fileoverview AI chat assistant that can recommend tasks.
 *
 * - continueChat - The main function to continue the conversation.
 * - ChatAssistantInput - The input type.
 * - ChatAssistantOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getScheduledTasksForUser, getUser } from '@/lib/data';
import {
    ChatAssistantInputSchema,
    type ChatAssistantInput,
    ChatAssistantOutputSchema,
    type ChatAssistantOutput,
} from '@/ai/schemas';

// Tool: Get available tasks for the user
const getAvailableTasks = ai.defineTool(
    {
        name: 'getAvailableTasks',
        description: 'Get a list of all available tasks for the current user for today, including personal and group tasks.',
        inputSchema: z.object({
            userId: z.string().describe("The ID of the user for whom to fetch tasks."),
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            taskType: z.enum(['group', 'personal']),
            estimatedTime: z.string().optional(),
            satisfactionRating: z.number().optional(),
        })),
    },
    async ({ userId }) => {
        const user = await getUser(userId);
        if (!user) return [];
        
        const tasks = await getScheduledTasksForUser(user);
        
        // Filter for today's incomplete tasks and map to a simpler format
        return tasks
            .filter(t => !t.isCompleted)
            .map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                taskType: t.taskType,
                estimatedTime: t.estimatedTime,
                satisfactionRating: t.satisfactionRating,
            }));
    }
);

// Main function to be called from the frontend
export async function continueChat(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
    return chatAssistantFlow(input);
}

// Define the Genkit flow with the tool
const chatAssistantFlow = ai.defineFlow(
    {
        name: 'chatAssistantFlow',
        inputSchema: ChatAssistantInputSchema,
        outputSchema: ChatAssistantOutputSchema,
        tools: [getAvailableTasks],
    },
    async (input) => {
        const llmResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview',
            prompt: `You are a helpful and friendly productivity assistant for the 'MaqsadM' app.
            Your goal is to help the user decide what to do.
            - If the user asks for task suggestions, use the getAvailableTasks tool to see what they have scheduled.
            - When making suggestions, consider the estimated time and satisfaction rating if the user provides that context.
            - If there are no tasks, encourage them to create a new one.
            - Keep your responses concise and motivational.
            - All responses must be in Uzbek.
            
            Current user ID: ${input.userId}
            `,
            history: input.history,
            tools: [getAvailableTasks],
        });

        return {
            response: llmResponse.text,
        };
    }
);
