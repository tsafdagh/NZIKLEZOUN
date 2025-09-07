'use server';
/**
 * @fileOverview Generates an educational video script based on a user-provided topic.
 *
 * - generateEducationalVideoScript - A function that generates the video script.
 * - GenerateEducationalVideoScriptInput - The input type for the generateEducationalVideoScript function.
 * - GenerateEducationalVideoScriptOutput - The return type for the generateEducationalVideoScript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEducationalVideoScriptInputSchema = z.object({
  topic: z.string().describe('The topic for the educational video script.'),
});
export type GenerateEducationalVideoScriptInput = z.infer<
  typeof GenerateEducationalVideoScriptInputSchema
>;

const GenerateEducationalVideoScriptOutputSchema = z.object({
  title: z.string().describe('The title of the video.'),
  introduction: z.string().describe('The introduction of the video script.'),
  keyPoints: z.string().describe('The key points of the video script.'),
  practicalExample: z.string().describe(
    'A practical example to illustrate the topic.'
  ),
  conclusion: z.string().describe('The conclusion of the video script.'),
  visualSuggestions: z
    .string()
    .describe('Visual suggestions for each section of the video.'),
});

export type GenerateEducationalVideoScriptOutput = z.infer<
  typeof GenerateEducationalVideoScriptOutputSchema
>;

export async function generateEducationalVideoScript(
  input: GenerateEducationalVideoScriptInput
): Promise<GenerateEducationalVideoScriptOutput> {
  return generateEducationalVideoScriptFlow(input);
}

const generateEducationalVideoScriptPrompt = ai.definePrompt({
  name: 'generateEducationalVideoScriptPrompt',
  input: {schema: GenerateEducationalVideoScriptInputSchema},
  output: {schema: GenerateEducationalVideoScriptOutputSchema},
  prompt: `You are an expert in creating educational video scripts. Your task is to generate a comprehensive and engaging video script based on the provided topic.

The script should include the following sections:

1.  Title: A catchy and informative title for the video.
2.  Introduction: An engaging introduction that grabs the viewer's attention and introduces the topic.
3.  Key Points: A breakdown of the main concepts, explained in a clear and concise manner.
4.  Practical Example: A real-world example to help viewers understand the practical application of the topic.
5.  Conclusion: A summary of the key takeaways and a call to action.
6.  Visual Suggestions: Ideas for visuals (e.g., animations, graphics, footage) to accompany each section of the script.

Topic: {{{topic}}}

Ensure that the script is well-structured, easy to understand, and visually appealing.

Output the script in a JSON format.
`,
});

const generateEducationalVideoScriptFlow = ai.defineFlow(
  {
    name: 'generateEducationalVideoScriptFlow',
    inputSchema: GenerateEducationalVideoScriptInputSchema,
    outputSchema: GenerateEducationalVideoScriptOutputSchema,
  },
  async input => {
    const {output} = await generateEducationalVideoScriptPrompt(input);
    return output!;
  }
);
