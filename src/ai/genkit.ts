
/**
 * @fileOverview Initializes and exports the Genkit AI instance.
 * This instance is configured with the Google AI plugin.
 * It assumes that the GOOGLE_GENAI_API_KEY environment variable is set.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// The Google AI plugin will automatically look for the GOOGLE_GENAI_API_KEY
// in your environment variables.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Note: `logLevel` and `enableTracingAndMetrics` are not configured directly in `genkit()` in v1.x.
  // Telemetry and logging are typically handled by plugins or specific configurations.
  // For Firebase, `enableFirebaseTelemetry()` from `@genkit-ai/firebase` would be used if you
  // were integrating Firebase Functions telemetry with Genkit for flows deployed there.
  // For client-side/Next.js Genkit usage, tracing might be observed via other means if configured.
});

console.log("Genkit initialized in src/ai/genkit.ts with the Google AI plugin.");

// Example of how to use a specific model (e.g., Gemini 1.5 Flash) with ai.generate:
//
// import { gemini15Flash } from '@genkit-ai/googleai'; // This specific named export might represent a model object or string.
//                                                    // Alternatively, use the model identifier string.
//
// async function exampleGeneration() {
//   try {
//     const { text } = await ai.generate({
//       model: 'gemini-1.5-flash-latest', // Recommended to use the string identifier for clarity
//       prompt: 'Tell me a fun fact about Next.js.',
//     });
//     console.log('Generated text:', text);
//     return text;
//   } catch (error) {
//     console.error('Error during AI generation:', error);
//     return 'Failed to generate text.';
//   }
// }
//
// // To define a flow, you would typically do so in a separate file under `src/ai/flows/`, for example:
// /*
// // In a file like src/ai/flows/exampleFlow.ts
// 'use server';
// import { ai } from '@/ai/genkit'; // Import the initialized ai instance
// import { z } from 'zod';
//
// export const exampleFlow = ai.defineFlow(
//   {
//     name: 'exampleFlow',
//     inputSchema: z.string().describe('Name to greet'),
//     outputSchema: z.string().describe('The greeting message'),
//   },
//   async (name) => {
//     const { text } = await ai.generate({
//         model: 'gemini-1.5-flash-latest',
//         prompt: `Create a friendly greeting for ${name}.`,
//     });
//     return text ?? "Could not generate greeting.";
//   }
// );
//
// export async function runExampleFlow(name: string) {
//   return await exampleFlow(name);
// }
// */
//
// // Then, you could call it from a server component or API route:
// // const greeting = await runExampleFlow('Developer');
// // console.log(greeting);
