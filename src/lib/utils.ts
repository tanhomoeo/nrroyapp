
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This function is no longer the primary ID generator for Firestore documents,
// as Firestore can auto-generate IDs. However, it can still be useful for
// client-side temporary IDs or other non-Firestore purposes.
// It's kept here for potential utility.
export function generateSimpleId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
