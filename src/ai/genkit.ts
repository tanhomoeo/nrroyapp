
'use server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Note: @genkit-ai/next plugin was removed due to previous installation/compatibility issues.
// The current Genkit flow (bangla-voice-typing) is a server action and should work without it
// when called from client components.

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  enableTracingAndMetrics: true, // Recommended for production, can be false for local dev if preferred
  logLevel: 'debug', // Or 'info', 'warn', 'error' for less verbosity
});
