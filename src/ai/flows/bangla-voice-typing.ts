// Bangla voice typing flow has been removed.
'use server';
// To prevent TypeScript errors if other files still try to import from here:
export const banglaVoiceTyping = async (input: any): Promise<any> => {
  console.warn('Bangla voice typing flow has been removed. Returning empty result.');
  return { correctedText: input?.voiceInput || '' };
};
export type BanglaVoiceTypingInput = { voiceInput: string };
export type BanglaVoiceTypingOutput = { correctedText: string };
