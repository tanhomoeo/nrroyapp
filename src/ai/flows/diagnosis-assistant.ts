// Diagnosis assistant flow has been removed.
'use server';

// To prevent TypeScript errors if other files still try to import from here:
export type DiagnosePatientInput = { symptoms: string; patientHistory: string; };
export type DiagnosePatientOutput = { diagnosisSuggestions: string; };

export async function diagnosePatient(input: DiagnosePatientInput): Promise<DiagnosePatientOutput> {
  console.warn('Diagnosis assistant flow has been removed. Returning empty suggestion.');
  return { diagnosisSuggestions: "AI diagnosis feature is temporarily unavailable." };
}
