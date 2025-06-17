
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
  let textToSet = typeof currentValue === 'string' ? currentValue : ""; // Ensure currentValue is a string or empty
  let processedTranscript = typeof newTranscript === 'string' ? newTranscript.trim() : ""; // Ensure newTranscript is a trimmed string or empty

  if (textToSet.length > 0 && !textToSet.endsWith(" ") && !textToSet.endsWith("\n")) {
    textToSet += " ";
  }

  if (processedTranscript.length > 0) {
    // Append the processed transcript, followed by a space if the transcript itself isn't empty.
    textToSet += processedTranscript + " ";
  }
  
  return textToSet;
};

