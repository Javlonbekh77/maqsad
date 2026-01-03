'use server';
/**
 * @fileoverview A conversational flow for creating personal tasks.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { DayOfWeek } from '@/lib/types';
import { createPersonalTask } from '@/lib/data';

// Define the structure of a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Define the input schema for the main flow
export const CreateTaskChatInputSchema = z.object({
  userId: z.string().describe("The ID of the user creating the task."),
  history: z.array(ChatMessageSchema).describe("The conversation history so far."),
});
export type CreateTaskChatInput = z.infer<typeof CreateTaskChatInputSchema>;

// Define the schema for the information we need to extract
const ExtractedTaskInfoSchema = z.object({
  isReadyToCreate: z.boolean().describe("Set to true only when all necessary information (title, schedule) has been gathered."),
  title: z.string().optional().describe("The title of the task."),
  schedule: z.array(z.string()).optional().describe("The schedule for the task (e.g., ['Monday', 'Wednesday'])."),
  followUpQuestion: z.string().describe("A question to ask the user to get the next piece of information, or a confirmation message if the task is ready."),
});

// Define the output schema for the main flow
export const CreateTaskChatOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user."),
  isTaskCreated: z.boolean().describe("True if the task was successfully created in this turn."),
});
export type CreateTaskChatOutput = z.infer<typeof CreateTaskChatOutputSchema>;


// Main exported function to be called by the client
export async function continueTaskChat(input: CreateTaskChatInput): Promise<CreateTaskChatOutput> {
    return createTaskChatFlow(input);
}


// Tool to create the personal task in Firestore
const createPersonalTaskTool = ai.defineTool(
    {
      name: 'createPersonalTaskInDb',
      description: 'Creates a personal task/habit in the database once all information is collected.',
      inputSchema: z.object({
        userId: z.string(),
        title: z.string(),
        schedule: z.array(z.string()),
        description: z.string().optional(),
      }),
      outputSchema: z.object({ success: z.boolean() }),
    },
    async ({ userId, title, schedule }) => {
      try {
        await createPersonalTask({
          userId,
          title,
          description: `AI yordamida yaratildi: ${title}`,
          schedule: schedule as DayOfWeek[],
        });
        return { success: true };
      } catch (e) {
        console.error("Failed to create task in DB", e);
        return { success: false };
      }
    }
  );


// The Genkit flow
const createTaskChatFlow = ai.defineFlow(
  {
    name: 'createTaskChatFlow',
    inputSchema: CreateTaskChatInputSchema,
    outputSchema: CreateTaskChatOutputSchema,
    // IMPORTANT: Include the tool here
    tools: [createPersonalTaskTool], 
  },
  async ({ userId, history }) => {
    
    // Construct the prompt with instructions for the AI
    const systemPrompt = `You are a friendly and helpful AI assistant for the MaqsadM app. Your goal is to help a user create a new personal task/habit by having a conversation in Uzbek.

    Your process is:
    1.  Ask clarifying questions one by one to get the required information: the task title and the schedule (which days of the week).
    2.  Once you have all the information (title and schedule), you MUST use the 'createPersonalTaskInDb' tool to save the task.
    3.  After calling the tool, confirm to the user that the task has been created.
    
    Keep your questions short and friendly.
    
    Current Conversation:
    ${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
    `;

    const model = ai.getModel('googleai/gemini-2.5-flash-preview');

    const result = await ai.generate({
      model,
      prompt: systemPrompt,
      config: {
        // Force the model to use a tool if it thinks it's ready.
        toolChoice: 'auto'
      }
    });

    const toolRequest = result.toolRequest;
    
    // Check if the model decided to use the creation tool
    if (toolRequest && toolRequest.name === 'createPersonalTaskInDb') {
      const toolResponse = await toolRequest.run();
      const args = toolRequest.input as any;
      if (toolResponse.success) {
        return {
          response: `Ajoyib! "${args.title}" nomli yangi vazifangiz muvaffaqiyatli yaratildi. Boshqaruv panelidan yoki profilingizdan uni topishingiz mumkin.`,
          isTaskCreated: true,
        };
      } else {
        return {
          response: "Kechirasiz, vazifani saqlashda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.",
          isTaskCreated: false,
        };
      }
    }

    // If the tool was not called, just return the model's text response
    return {
      response: result.text,
      isTaskCreated: false,
    };
  }
);
