// Genkit AI functionality has been removed or is currently disabled.
// This file is kept for potential future use or to avoid breaking imports.

// If you re-integrate Genkit, initialize it here:
// import { genkit } from 'genkit';
// import { googleAI } from '@genkit-ai/googleai';
// import * as genkitNext from '@genkit-ai/next'; // If using Next.js plugin

// export const ai = genkit({
//   plugins: [
//     googleAI(),
//     // genkitNext.nextPlugin(), // Uncomment if @genkit-ai/next is installed and used
//   ],
//   enableTracingAndMetrics: true,
//   logLevel: 'debug',
// });

console.warn("Genkit AI features are currently disabled. Genkit initialization in src/ai/genkit.ts is commented out.");

// To prevent import errors if other files still try to import 'ai'
export const ai = {
    defineFlow: (config: any, handler: any) => { 
        console.warn(`Genkit defineFlow for ${config.name} called but Genkit is disabled.`);
        return async (...args: any[]) => {
            console.warn(`Genkit flow ${config.name} executed but Genkit is disabled. Returning mock error.`);
            throw new Error(`Genkit flow ${config.name} cannot be executed as Genkit is disabled.`);
        };
    },
    definePrompt: (config: any) => {
        console.warn(`Genkit definePrompt for ${config.name} called but Genkit is disabled.`);
        return async (...args: any[]) => {
            console.warn(`Genkit prompt ${config.name} executed but Genkit is disabled. Returning mock error output.`);
            return { output: null, error: `Genkit prompt ${config.name} cannot be executed as Genkit is disabled.` };
        };
    },
    generate: async (options: any) => {
        console.warn("Genkit ai.generate called but Genkit is disabled.");
        return { text: () => Promise.resolve("AI response unavailable (Genkit disabled)."), output: null };
    },
     generateStream: (options: any) => {
        console.warn("Genkit ai.generateStream called but Genkit is disabled.");
        async function* emptyStream() {
            yield { text: "AI stream unavailable." };
        }
        return { 
            stream: emptyStream(), 
            response: Promise.resolve({ text: () => "AI response unavailable." }) 
        };
    }
    // Add other Genkit methods as needed if they cause import issues elsewhere
};
