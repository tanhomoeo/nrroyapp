'use server';

/**
 * @fileOverview Provides AI-driven suggestions for homeopathic diagnosis and remedies based on entered symptoms and patient history.
 *
 * - diagnosePatient - A function that provides homeopathic diagnosis suggestions.
 * - DiagnosePatientInput - The input type for the diagnosePatient function.
 * - DiagnosePatientOutput - The return type for the diagnosePatient function.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const DiagnosePatientInputSchema = z.object({
  symptoms: z
    .string()
    .describe('A detailed description of the patient\'s symptoms, including physical, mental, and general aspects.'),
  patientHistory: z
    .string()
    .describe('The patient\'s medical history and any relevant background information.'),
});

export type DiagnosePatientInput = z.infer<typeof DiagnosePatientInputSchema>;

const DiagnosePatientOutputSchema = z.object({
  diagnosisSuggestions: z
    .string()
    .describe('AI-driven suggestions for possible homeopathic medicines and their key indications relevant to the presented case.'),
});

export type DiagnosePatientOutput = z.infer<typeof DiagnosePatientOutputSchema>;

export async function diagnosePatient(input: DiagnosePatientInput): Promise<DiagnosePatientOutput> {
  return diagnosePatientFlow(input);
}

const prompt = ai.definePrompt({
  name: 'homeopathicDiagnosisAssistantPrompt',
  input: {schema: DiagnosePatientInputSchema},
  output: {schema: DiagnosePatientOutputSchema},
  prompt: `You are an expert AI assistant specializing in homeopathic medicine.

You are provided with the patient's symptoms (which may include physical, mental, and general aspects) and medical history. Based on this information, please provide a few potential homeopathic medicines.

For each suggested medicine, include:
1. The name of the medicine.
2. Key indications from the provided symptoms that point to this medicine.
3. A brief rationale for why this medicine might be suitable.

Consider the totality of symptoms if possible.

Patient's Symptoms:
{{{symptoms}}}

Patient's Medical History:
{{{patientHistory}}}

Suggested Homeopathic Medicines and Rationale:`,
});

const diagnosePatientFlow = ai.defineFlow(
  {
    name: 'diagnosePatientFlow',
    inputSchema: DiagnosePatientInputSchema,
    outputSchema: DiagnosePatientOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
