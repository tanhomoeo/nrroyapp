
'use server';
/**
 * @fileOverview AI flow to summarize patient complaints.
 *
 * - summarizeComplaints - A function that takes detailed complaints and returns a concise summary.
 * - ComplaintSummaryInput - The input type for the summarizeComplaints function.
 * - ComplaintSummaryOutput - The return type for the summarizeComplaints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ComplaintSummaryInput, ComplaintSummaryOutput } from '@/lib/types'; // Using types from lib

const ComplaintSummaryInputSchema = z.object({
  complaintText: z
    .string()
    .min(10, { message: "Complaint text must be at least 10 characters long." })
    .describe('Detailed patient complaints to be summarized.'),
});

const ComplaintSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the patient complaints.'),
});

export async function summarizeComplaints(input: ComplaintSummaryInput): Promise<ComplaintSummaryOutput> {
  return complaintSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'complaintSummaryPrompt',
  input: {schema: ComplaintSummaryInputSchema},
  output: {schema: ComplaintSummaryOutputSchema},
  prompt: `You are a helpful medical assistant. Please summarize the following patient complaints into a concise paragraph. 
  Focus on the key symptoms, duration, and severity if mentioned. Keep the summary brief and informative for a doctor's quick review.

Patient Complaints:
{{{complaintText}}}

Summary:`,
});

const complaintSummaryFlow = ai.defineFlow(
  {
    name: 'complaintSummaryFlow',
    inputSchema: ComplaintSummaryInputSchema,
    outputSchema: ComplaintSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("No output from AI prompt for complaint summary.");
    }
    return output;
  }
);
