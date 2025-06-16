
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import * as genkitNext from '@genkit-ai/next'; // Changed import

export const ai = genkit({
  plugins: [
    googleAI(),
    genkitNext.nextPlugin(), // Changed usage
  ],
  // model: 'googleai/gemini-2.0-flash', // Removed: Model should be specified per call or prompt.
});
