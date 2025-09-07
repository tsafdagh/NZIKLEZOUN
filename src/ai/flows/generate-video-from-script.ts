'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a video from a script.
 *
 * The flow takes a script as input and returns a video URL.
 *
 * @fileOverview Generates video from a provided script.
 * - generateVideoFromScript - Function to generate video from script.
 * - GenerateVideoFromScriptInput - Input type for the function.
 * - GenerateVideoFromScriptOutput - Output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as fs from 'fs';
import {Readable} from 'stream';

const GenerateVideoFromScriptInputSchema = z.object({
  script: z.string().describe('The script to generate the video from.'),
});
export type GenerateVideoFromScriptInput = z.infer<typeof GenerateVideoFromScriptInputSchema>;

const GenerateVideoFromScriptOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type GenerateVideoFromScriptOutput = z.infer<typeof GenerateVideoFromScriptOutputSchema>;

export async function generateVideoFromScript(input: GenerateVideoFromScriptInput): Promise<GenerateVideoFromScriptOutput> {
  return generateVideoFromScriptFlow(input);
}

const generateVideoFromScriptFlow = ai.defineFlow(
  {
    name: 'generateVideoFromScriptFlow',
    inputSchema: GenerateVideoFromScriptInputSchema,
    outputSchema: GenerateVideoFromScriptOutputSchema,
  },
  async input => {
    let {operation} = await ai.generate({
      model: 'googleai/veo-2.0-generate-001',
      prompt: input.script,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes. Note that this may take some time, maybe even up to a minute. Design the UI accordingly.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video');
    }

    return {
      videoUrl: video.media!.url,
    };
  }
);
