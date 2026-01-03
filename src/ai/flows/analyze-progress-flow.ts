'use server';
/**
 * @fileoverview Analyzes user progress and provides motivational feedback.
 *
 * - analyzeProgress - A function that takes user data and returns an AI-generated analysis.
 * - ProgressAnalysisInput - The input type for the analysis function.
 * - ProgressAnalysisOutput - The return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { 
    ProgressAnalysisInputSchema, 
    type ProgressAnalysisInput, 
    ProgressAnalysisOutputSchema,
    type ProgressAnalysisOutput
} from '@/ai/schemas';

// Define the main function that will be called from the frontend
export async function analyzeProgress(input: ProgressAnalysisInput): Promise<ProgressAnalysisOutput> {
  return analyzeProgressFlow(input);
}

// Define the AI prompt
const analysisPrompt = ai.definePrompt({
  name: 'progressAnalysisPrompt',
  input: { schema: ProgressAnalysisInputSchema },
  output: { schema: ProgressAnalysisOutputSchema },
  prompt: `You are a friendly and insightful motivational coach named 'AI Tahlilchi'. 
Your task is to analyze a user's recent progress and provide a short, encouraging, and actionable insight in the Uzbek language. 
The user wants to achieve their goals by building good habits.
Look at their recent task history. Are they consistent? Are they making progress on tasks related to their stated goals and habits?

User's Goals: {{goals}}
User's Habits: {{habits}}
Recent Task History (last 20):
{{#each taskHistory}}
- Task on {{date}} (type: {{taskType}})
{{/each}}

Based on this, provide a 1-2 sentence analysis. Be specific but brief. 
For example, if they are consistent with a 'personal' task, praise that. If they seem to be stalling, gently encourage them.
Example output: "Bu hafta barqarorlik ko'rsatdingiz, ayniqsa shaxsiy vazifalarda. Maqsadlaringizga erishish uchun ajoyib poydevor!"
Another example: "So'nggi kunlarda faolligingiz biroz pasayganga o'xshaydi. Keling, bugundan kichik bir vazifani bajarishdan boshlaymiz!"

Your analysis (in Uzbek):
`,
});

// Define the Genkit flow
const analyzeProgressFlow = ai.defineFlow(
  {
    name: 'analyzeProgressFlow',
    inputSchema: ProgressAnalysisInputSchema,
    outputSchema: ProgressAnalysisOutputSchema,
  },
  async (input) => {
    // If there's no history, provide a default welcoming message
    if (input.taskHistory.length === 0) {
      return { text: "Maqsadlar sari ilk qadamingizni qo'ying! Bugun birinchi vazifangizni belgilang." };
    }

    const { output } = await analysisPrompt(input);
    return output!;
  }
);
