import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a simple unique ID.
 * For more robust IDs, consider using a library like `uuid`.
 * This is a basic client-side ID generator.
 */
export function generateSimpleId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (e.g. older browsers, or server-side if mistakenly called)
  // Math.random should be unique enough for local client-side data.
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
