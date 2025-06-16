
'use server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
// import { nextPlugin } from '@genkit-ai/next'; // Removed nextPlugin import

// Make sure GOOGLE_GENAI_API_KEY is set in your .env or .env.local file
// Example: GOOGLE_GENAI_API_KEY=your_api_key_here

export const ai = genkit({
  plugins: [
    googleAI(),
    // nextPlugin(), // Removed nextPlugin usage
  ],
  enableTracingAndMetrics: true, 
  logLevel: 'debug', 
});

// To run the Genkit Developer UI (optional):
// 1. Ensure you have `genkit-cli` installed (`npm install -g genkit-cli` or add to devDependencies)
// 2. Run `genkit start` in your terminal (ensure port is not conflicting, default is 4000, or use --port XXXX)
// 3. Open http://localhost:4000 (or your specified port) in your browser
