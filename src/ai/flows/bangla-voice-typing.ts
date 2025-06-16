
'use server';
/**
 * @fileOverview Bangla text correction and punctuation AI flow.
 *
 * - banglaVoiceTyping - A function that takes Bangla text and returns a corrected version.
 * - BanglaVoiceInput - The input type for the banglaVoiceTyping function.
 * - BanglaVoiceOutput - The return type for the banglaVoiceTyping function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod'; // Use z from genkit/zod

export const BanglaVoiceInputSchema = z.object({
  voiceInput: z.string().min(1, { message: "বাংলা টেক্সট আবশ্যক।" }).describe('ভয়েস থেকে প্রাপ্ত বাংলা টেক্সট অথবা পরিমার্জন করার জন্য টেক্সট'),
});
export type BanglaVoiceInput = z.infer<typeof BanglaVoiceInputSchema>;

export const BanglaVoiceOutputSchema = z.object({
  correctedText: z.string().describe('পরিমার্জিত এবং যতিচিহ্নসহ বাংলা টেক্সট'),
});
export type BanglaVoiceOutput = z.infer<typeof BanglaVoiceOutputSchema>;

// Define the prompt for text correction
const banglaCorrectionPrompt = ai.definePrompt(
  {
    name: 'banglaCorrectionPrompt',
    input: { schema: BanglaVoiceInputSchema },
    output: { schema: BanglaVoiceOutputSchema },
    prompt: `তুমি একজন অভিজ্ঞ বাংলা ভাষা সম্পাদক। তোমার কাজ হলো প্রদত্ত বাংলা বাক্য বা অনুচ্ছেদকে পরিমার্জন করা। এর মধ্যে অন্তর্ভুক্ত থাকবে:
    ১. সঠিক যতিচিহ্ন (Punctuation) ব্যবহার করা।
    ২. সাধারণ ব্যাকরণগত ভুল সংশোধন করা।
    ৩. বাক্যকে আরও স্পষ্ট ও সাবলীল করা, যদি প্রয়োজন হয়।
    ৪. অপ্রয়োজনীয় শব্দ বা অংশ বাদ দেওয়া।
    শুধুমাত্র পরিমার্জিত টেক্সট আউটপুট হিসেবে দেবে। কোনো অতিরিক্ত ভূমিকা বা মন্তব্য করবে না।

    প্রদত্ত টেক্সট:
    {{{voiceInput}}}

    পরিমার্জিত টেক্সট:`,
  },
);


// Define the flow
const banglaVoiceTypingFlow = ai.defineFlow(
  {
    name: 'banglaVoiceTypingFlow',
    inputSchema: BanglaVoiceInputSchema,
    outputSchema: BanglaVoiceOutputSchema,
  },
  async (input) => {
    const { output } = await banglaCorrectionPrompt(input);
    if (!output) {
      // Fallback or error handling if output is null/undefined
      console.error("Bangla correction prompt did not return output.");
      return { correctedText: input.voiceInput }; // Return original input as fallback
    }
    return output;
  }
);

// Exported async wrapper function to call the flow
export async function banglaVoiceTyping(input: BanglaVoiceInput): Promise<BanglaVoiceOutput> {
  return banglaVoiceTypingFlow(input);
}
