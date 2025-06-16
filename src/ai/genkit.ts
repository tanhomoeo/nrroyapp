
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { nextPlugin } from '@genkit-ai/next'; // Reverted to direct named import

export const ai = genkit({
  plugins: [
    googleAI(),
    nextPlugin(), // Direct call of the imported plugin
  ],
  // model: 'googleai/gemini-2.0-flash', // Removed: Model should be specified per call or prompt.
});
