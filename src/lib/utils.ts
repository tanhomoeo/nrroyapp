
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSimpleId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const appendFinalTranscript = (currentValue: string | undefined | null, newTranscript: string): string => {
  let textToSet = typeof currentValue === 'string' ? currentValue : ""; 
  let processedTranscript = typeof newTranscript === 'string' ? newTranscript.trim() : ""; 

  if (!processedTranscript) { // If new transcript is empty, return current value as is
    return textToSet;
  }

  if (textToSet.length > 0 && !textToSet.endsWith(" ") && !textToSet.endsWith("\n")) {
    textToSet += " "; // Add a space if current text is not empty and doesn't end with a space
  }
  
  // Append the processed transcript. If it's a single word, no trailing space is needed yet.
  // If it's multiple words, it might already have spaces internally.
  // A trailing space is generally good for subsequent appends.
  textToSet += processedTranscript + " "; 
  
  return textToSet;
};
    