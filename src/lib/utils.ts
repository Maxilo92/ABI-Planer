import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a potential Firestore Timestamp to a JavaScript Date object.
 */
export function toDate(date: any): Date {
  if (!date) return new Date()
  
  // If it's already a Date object
  if (date instanceof Date) return date
  
  // If it's a Firestore Timestamp (has toDate method)
  if (typeof date.toDate === 'function') return date.toDate()
  
  // If it's a POJO Timestamp { seconds, nanoseconds }
  if (date.seconds !== undefined) {
    return new Date(date.seconds * 1000)
  }
  
  // If it's a string (ISO) or number (timestamp)
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}
