
// This file is now deprecated and can be removed.
// The functionality has been superseded by src/ai/flows/complaint-analyzer-flow.ts
'use server';
import type { ComplaintSummaryInput, ComplaintSummaryOutput } from '@/lib/types';

export async function summarizeComplaints(input: ComplaintSummaryInput): Promise<ComplaintSummaryOutput> {
  return { summary: "AI summary feature is temporarily unavailable. Please use the new AI Complaint Analyzer." };
}
