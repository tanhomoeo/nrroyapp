import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {nextPlugin} from '@genkit-ai/next'; // Added import

export const ai = genkit({
  plugins: [
    googleAI(),
    nextPlugin(), // Added nextPlugin
  ],
  // model: 'googleai/gemini-2.0-flash', // Removed: Model should be specified per call or prompt.
});
