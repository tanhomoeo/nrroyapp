
'use server';

/**
 * @fileOverview Implements Bangla voice typing with punctuation and grammar correction.
 *
 * - banglaVoiceTyping - A function that processes Bangla voice input and returns corrected text.
 * - BanglaVoiceTypingInput - The input type for the banglaVoiceTyping function.
 * - BanglaVoiceTypingOutput - The return type for the banglaVoiceTyping function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BanglaVoiceTypingInputSchema = z.object({
  voiceInput: z
    .string()
    .describe('Bangla voice input to be transcribed and corrected.'),
});
export type BanglaVoiceTypingInput = z.infer<typeof BanglaVoiceTypingInputSchema>;

const BanglaVoiceTypingOutputSchema = z.object({
  correctedText: z
    .string()
    .describe('The transcribed and corrected Bangla text with proper punctuation and grammar.'),
});
export type BanglaVoiceTypingOutput = z.infer<typeof BanglaVoiceTypingOutputSchema>;

export async function banglaVoiceTyping(input: BanglaVoiceTypingInput): Promise<BanglaVoiceTypingOutput> {
  return banglaVoiceTypingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'banglaVoiceTypingPrompt',
  input: {schema: BanglaVoiceTypingInputSchema},
  output: {schema: BanglaVoiceTypingOutputSchema},
  prompt: `You are a helpful assistant specialized in transcribing and correcting Bangla text from voice input.

  Correct the following Bangla text for grammar and punctuation:
  {{voiceInput}}

  Return only the corrected text.`,
});

const banglaVoiceTypingFlow = ai.defineFlow(
  {
    name: 'banglaVoiceTypingFlow',
    inputSchema: BanglaVoiceTypingInputSchema,
    outputSchema: BanglaVoiceTypingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI did not provide an output for Bangla voice typing correction.");
    }
    return output;
  }
);
