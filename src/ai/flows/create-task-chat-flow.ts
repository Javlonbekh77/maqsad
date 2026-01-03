'use server';
/**
 * @fileoverview A conversational flow for creating personal tasks.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { DayOfWeek } from '@/lib/types';
import { createPersonalTask } from '@/lib/data';
import {
  CreateTaskChatInputSchema,
  type CreateTaskChatInput,
  CreateTaskChatOutputSchema,
  type CreateTaskChatOutput,
} from '@/ai/schemas';


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

    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview',
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
