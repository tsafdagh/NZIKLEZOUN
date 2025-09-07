'use server';

import {
  generateEducationalVideoScript,
  type GenerateEducationalVideoScriptOutput,
} from '@/ai/flows/generate-educational-video-script';
import { generateVideoFromScript } from '@/ai/flows/generate-video-from-script';
import { z } from 'zod';

const scriptInputSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters long.'),
});

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function generateScriptAction(params: {
  topic: string;
}): Promise<ActionResult<GenerateEducationalVideoScriptOutput>> {
  try {
    const validation = scriptInputSchema.safeParse(params);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const script = await generateEducationalVideoScript({
      topic: validation.data.topic,
    });
    return { success: true, data: script };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      success: false,
      error: `Failed to generate script. ${errorMessage}`,
    };
  }
}

export async function generateVideoAction(params: {
  script: GenerateEducationalVideoScriptOutput;
}): Promise<ActionResult<{ videoUrl: string }>> {
  try {
    const {
      title,
      introduction,
      keyPoints,
      practicalExample,
      conclusion,
      visualSuggestions,
    } = params.script;
    
    const fullScript = `
        Title: ${title}\n\n
        Introduction: ${introduction}\n\n
        Key Points: ${keyPoints}\n\n
        Practical Example: ${practicalExample}\n\n
        Conclusion: ${conclusion}\n\n
        Visual Suggestions for the video: ${visualSuggestions}
        `;

    const result = await generateVideoFromScript({ script: fullScript });
    return { success: true, data: result };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      success: false,
      error: `Failed to generate video. This can happen during high demand. Please try again later. Details: ${errorMessage}`,
    };
  }
}
