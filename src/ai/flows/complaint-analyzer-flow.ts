
'use server';
/**
 * @fileOverview A Genkit flow to analyze patient complaints in Bengali,
 * summarize them into key points, and suggest potential homeopathic medicines
 * with appropriate disclaimers.
 *
 * - analyzeComplaint - A function that handles the complaint analysis.
 * - ComplaintAnalyzerInput - The input type for the analyzeComplaint function.
 * - ComplaintAnalyzerOutput - The return type for the analyzeComplaint function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define Zod schema for input
const ComplaintAnalyzerInputSchema = z.object({
  complaintText: z.string().min(10, { message: "অনুগ্রহ করে রোগীর সম্পূর্ণ অভিযোগ বিস্তারিতভাবে লিখুন।" }).describe('The patient\'s complaint in Bengali language.'),
});
export type ComplaintAnalyzerInput = z.infer<typeof ComplaintAnalyzerInputSchema>;

// Define Zod schema for output
const ComplaintAnalyzerOutputSchema = z.object({
  summaryPoints: z.array(z.string()).describe('An array of strings, where each string is a key point summarized from the complaint.'),
  medicineSuggestions: z.array(z.string()).describe('An array of strings, where each string is a suggested homeopathic medicine with potency and a brief note in Bengali (e.g., "Arnica Montana 30C - আঘাত ও ব্যথার জন্য"). This is only a suggestion for consideration and not a final prescription.'),
});
export type ComplaintAnalyzerOutput = z.infer<typeof ComplaintAnalyzerOutputSchema>;

// Exported wrapper function to be called from the UI
export async function analyzeComplaint(input: ComplaintAnalyzerInput): Promise<ComplaintAnalyzerOutput> {
  // Validate input using the Zod schema before calling the flow
  const validationResult = ComplaintAnalyzerInputSchema.safeParse(input);
  if (!validationResult.success) {
    // Log and throw an error with concatenated validation messages
    const errorMessages = validationResult.error.issues.map(issue => issue.message).join(', ');
    console.error("Invalid input for analyzeComplaint:", validationResult.error.format());
    throw new Error(`ইনপুট ডেটা সঠিক নয়: ${errorMessages}`);
  }
  return complaintAnalyzerFlow(validationResult.data);
}

// Define the Genkit prompt
const complaintAnalysisPrompt = ai.definePrompt({
  name: 'complaintAnalysisPrompt',
  input: { schema: ComplaintAnalyzerInputSchema },
  output: { schema: ComplaintAnalyzerOutputSchema },
  model: 'gemini-1.5-flash-latest', // Using a suitable Gemini model
  prompt: `আপনি একজন অভিজ্ঞ হোমিওপ্যাথিক सहायक। ব্যবহারকারী বাংলা ভাষায় রোগীর অভিযোগ জানাবেন।
আপনার কাজগুলো হলো:
১. রোগীর অভিযোগটি মনোযোগ দিয়ে বিশ্লেষণ করা।
২. অভিযোগের প্রধান লক্ষণ এবং সমস্যাগুলো কয়েকটি সংক্ষিপ্ত ও স্পষ্ট বাংলা পয়েন্ট আকারে তুলে ধরা।
৩. চিহ্নিত লক্ষণগুলির উপর ভিত্তি করে, ৩ থেকে ৫টি সম্ভাব্য প্রাসঙ্গিক হোমিওপ্যাথিক ঔষধের নাম প্রস্তাব করা। প্রতিটি ঔষধের নামের সাথে তার শক্তি (যেমন 30C, 200C ইত্যাদি) এবং ঔষধটি কী ধরণের প্রধান লক্ষণে প্রযোজ্য হতে পারে তার একটি সংক্ষিপ্ত বাংলা নোট যোগ করুন (উদাহরণস্বরূপ: "Belladonna 30C - হঠাৎ শুরু হওয়া তীব্র মাথা ব্যথা ও জ্বরের জন্য।")।
৪. **গুরুত্বপূর্ণ দ্রষ্টব্য:** স্পষ্টভাবে উল্লেখ করবেন যে এটি শুধুমাত্র বিবেচনার জন্য একটি পরামর্শ, কোনো চূড়ান্ত প্রেসক্রিপশন নয়। রোগীদের সর্বদা একজন যোগ্যতাসম্পন্ন চিকিৎসকের সাথে পরামর্শ করা উচিত।
৫. আপনার সম্পূর্ণ উত্তরটি অবশ্যই একটি JSON অবজেক্ট হিসেবে দিতে হবে, যেখানে দুটি প্রধান কী থাকবে:
    ক) "summaryPoints": এটি একটি স্ট্রিং অ্যারে হবে, যেখানে প্রতিটি স্ট্রিং অভিযোগের একটি সারাংশ পয়েন্ট।
    খ) "medicineSuggestions": এটি একটি স্ট্রিং অ্যারে হবে, যেখানে প্রতিটি স্ট্রিং একটি প্রস্তাবিত ঔষধের নাম, শক্তি ও সংক্ষিপ্ত বিবরণ।

রোগীর অভিযোগ:
{{{complaintText}}}

আপনার উত্তর JSON ফরম্যাটে দিন।
`,
});

// Define the Genkit flow
const complaintAnalyzerFlow = ai.defineFlow(
  {
    name: 'complaintAnalyzerFlow',
    inputSchema: ComplaintAnalyzerInputSchema,
    outputSchema: ComplaintAnalyzerOutputSchema,
  },
  async (input) => {
    try {
      console.log('Calling complaintAnalysisPrompt with input:', JSON.stringify(input, null, 2));
      const { output } = await complaintAnalysisPrompt(input);

      if (!output) {
        console.error('Complaint analysis flow did not produce an output from the LLM.');
        throw new Error('AI বিশ্লেষণ থেকে কোনো উত্তর পাওয়া যায়নি। মডেলটি কোনো আউটপুট দেয়নি।');
      }
      
      // Validate the output from LLM against the schema (Genkit does this implicitly, but good for debugging)
      const validation = ComplaintAnalyzerOutputSchema.safeParse(output);
      if (!validation.success) {
          console.error('LLM output validation failed:', validation.error.format());
          throw new Error('AI মডেল থেকে প্রাপ্ত উত্তরটি সঠিক ফরম্যাটে নেই।');
      }

      console.log('Complaint analysis flow received output:', JSON.stringify(output, null, 2));
      return output;
    } catch (error: any) {
      console.error('Error in complaintAnalyzerFlow:', error);
      // Provide a more user-friendly error message
      let errorMessage = 'অভিযোগ বিশ্লেষণ করার সময় একটি অপ্রত্যাশিত ত্রুটি হয়েছে।';
      if (error.message) {
        if (error.message.includes('deadline') || error.message.includes('timeout')) {
          errorMessage = 'AI সার্ভার থেকে উত্তর পেতে বেশি সময় লাগছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
        } else if (error.message.includes('API key not valid')) {
          errorMessage = 'AI পরিষেবা ব্যবহারের জন্য API কী সঠিক নয়। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
           errorMessage = 'AI পরিষেবা ব্যবহারের সীমা অতিক্রম করেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
        } else if (error.message.startsWith('ইনপুট ডেটা সঠিক নয়:') || error.message.startsWith('AI মডেল থেকে প্রাপ্ত উত্তরটি সঠিক ফরম্যাটে নেই') || error.message.startsWith('AI বিশ্লেষণ থেকে কোনো উত্তর পাওয়া যায়নি')) {
           errorMessage = error.message; // Pass through specific errors
        }
      }
      throw new Error(errorMessage);
    }
  }
);
