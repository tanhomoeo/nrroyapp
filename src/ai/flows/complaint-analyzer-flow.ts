
'use server';
/**
 * @fileOverview A Genkit flow to analyze patient complaints, summarize them into points,
 * and suggest potential homeopathic medicines.
 *
 * - analyzeComplaint - A function that handles the complaint analysis.
 * - ComplaintAnalyzerInput - The input type for the analyzeComplaint function.
 * - ComplaintAnalyzerOutput - The return type for the analyzeComplaint function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ComplaintAnalyzerInput, ComplaintAnalyzerOutput } from '@/lib/types';

const ComplaintAnalyzerInputSchema = z.object({
  complaintText: z.string().min(10, { message: "অনুগ্রহ করে রোগীর সম্পূর্ণ অভিযোগ বিস্তারিতভাবে লিখুন।" }).describe('The patient\'s complaint in Bengali.'),
});

const ComplaintAnalyzerOutputSchema = z.object({
  summaryPoints: z.array(z.string()).describe('An array of strings, where each string is a key point summarized from the complaint.'),
  medicineSuggestions: z.array(z.string()).describe('An array of strings, where each string is a suggested homeopathic medicine with a brief note (e.g., "Arnica Montana 30C - আঘাত ও ব্যথার জন্য").'),
});

// Exporting types for use in other files
export type { ComplaintAnalyzerInput, ComplaintAnalyzerOutput };

export async function analyzeComplaint(input: ComplaintAnalyzerInput): Promise<ComplaintAnalyzerOutput> {
  // Validate input using the Zod schema before calling the flow
  const validationResult = ComplaintAnalyzerInputSchema.safeParse(input);
  if (!validationResult.success) {
    // Handle validation errors, perhaps by throwing an error or returning a specific error structure
    // For simplicity, we'll log and throw. In a real app, you might return a structured error.
    console.error("Invalid input for analyzeComplaint:", validationResult.error.format());
    throw new Error(validationResult.error.issues.map(issue => issue.message).join(', '));
  }
  return complaintAnalyzerFlow(validationResult.data);
}

const complaintAnalysisPrompt = ai.definePrompt({
  name: 'complaintAnalysisPrompt',
  input: { schema: ComplaintAnalyzerInputSchema },
  output: { schema: ComplaintAnalyzerOutputSchema },
  prompt: `আপনি একজন অভিজ্ঞ হোমিওপ্যাথিক सहायक। ব্যবহারকারী বাংলা ভাষায় রোগীর অভিযোগ জানাবেন।
আপনার কাজগুলো হলো:
১. অভিযোগটি মনোযোগ দিয়ে বিশ্লেষণ করা।
২. প্রধান লক্ষণ এবং সমস্যাগুলো কয়েকটি সংক্ষিপ্ত পয়েন্ট আকারে তুলে ধরা। প্রতিটি পয়েন্ট যেন স্পষ্ট হয়।
৩. চিহ্নিত লক্ষণগুলির উপর ভিত্তি করে, ৩-৫টি সম্ভাব্য প্রাসঙ্গিক হোমিওপ্যাথিক ঔষধের নাম প্রস্তাব করা। স্পষ্টভাবে উল্লেখ করবেন যে এটি শুধুমাত্র বিবেচনার জন্য একটি পরামর্শ, কোনো চূড়ান্ত প্রেসক্রিপশন নয়। ঔষধের নামের সাথে শক্তি (যেমন 30C, 200C) এবং ঔষধটি কী ধরণের লক্ষণে প্রযোজ্য হতে পারে তার একটি সংক্ষিপ্ত নোট যোগ করুন (যেমন, "Belladonna 30C - হঠাৎ শুরু হওয়া তীব্র মাথা ব্যথা ও জ্বরের জন্য।")।
৪. আপনার উত্তরটি JSON ফরম্যাটে দিন, যেখানে দুটি কী থাকবে: "summaryPoints" (একটি স্ট্রিং অ্যারে, যেখানে প্রতিটি স্ট্রিং একটি সারাংশ পয়েন্ট) এবং "medicineSuggestions" (একটি স্ট্রিং অ্যারে, যেখানে প্রতিটি স্ট্রিং একটি প্রস্তাবিত ঔষধের নাম ও সংক্ষিপ্ত বিবরণ)।

রোগীর অভিযোগ:
{{{complaintText}}}
`,
});

const complaintAnalyzerFlow = ai.defineFlow(
  {
    name: 'complaintAnalyzerFlow',
    inputSchema: ComplaintAnalyzerInputSchema,
    outputSchema: ComplaintAnalyzerOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await complaintAnalysisPrompt(input);
      if (!output) {
        // This case should ideally be handled by Genkit if the LLM fails to produce output matching the schema.
        // However, having a fallback or more specific error handling here can be useful.
        console.error('Complaint analysis flow did not produce an output.');
        throw new Error('AI বিশ্লেষণ থেকে কোনো উত্তর পাওয়া যায়নি।');
      }
      return output;
    } catch (error) {
      console.error('Error in complaintAnalyzerFlow:', error);
      // Re-throw the error or return a structured error response
      // For now, re-throwing to be caught by the calling page.
      throw error;
    }
  }
);
