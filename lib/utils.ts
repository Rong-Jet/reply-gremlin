import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)

  // If invalid date, return original string
  if (isNaN(date.getTime())) {
    return dateString
  }

  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    // Today - show time
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } else if (diffInDays === 1) {
    return "Yesterday"
  } else if (diffInDays < 7) {
    // Within a week - show day name
    return date.toLocaleDateString([], { weekday: "short" })
  } else {
    // Older - show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }
}

/**
 * Parse a response that might be wrapped in markdown code blocks
 * 
 * @param text The response text that might contain markdown code blocks
 * @returns Parsed JSON data
 */
export function parseCodeBlockResponse(text: string): any {
  // Check if the response is wrapped in markdown code blocks
  let jsonText = text;
  
  // If it starts with ```json or ```
  if (text.startsWith('```json') || text.startsWith('```')) {
    // Extract the content between the markdown code blocks
    jsonText = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  
  try {
    // Parse the cleaned JSON
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error parsing response:', error);
    console.error('Response content:', jsonText);
    throw new Error('Invalid JSON in response');
  }
}
