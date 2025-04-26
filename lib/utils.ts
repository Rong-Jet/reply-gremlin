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
