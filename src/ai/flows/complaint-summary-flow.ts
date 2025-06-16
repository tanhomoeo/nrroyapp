// Complaint summary flow has been removed.
'use server';
import type { ComplaintSummaryInput, ComplaintSummaryOutput } from '@/lib/types';

// To prevent TypeScript errors if other files still try to import from here:
export async function summarizeComplaints(input: ComplaintSummaryInput): Promise<ComplaintSummaryOutput> {
  console.warn('Complaint summary flow has been removed. Returning empty summary.');
  return { summary: "AI summary feature is temporarily unavailable." };
}
// export type ComplaintSummaryInput = { complaintText: string }; // Already in types.ts
// export type ComplaintSummaryOutput = { summary: string }; // Already in types.ts
