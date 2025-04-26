"use client"

import { useState } from "react"
import type { Email } from "@/types/email"
import { formatDate } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

interface EmailDisplayProps {
  email: Email | null
}

export function EmailDisplay({ email }: EmailDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  if (!email) {
    return <div className="flex items-center justify-center h-full text-gray-500">No email selected</div>
  }

  // Erstelle eine Zusammenfassung des E-Mail-Inhalts (erste 100 Zeichen)
  const summary = email.content.substring(0, 100) + (email.content.length > 100 ? "..." : "")

  return (
    <div className="p-6 h-[calc(100%-3.5rem)] overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{email.subject}</h3>
        <div className="flex justify-between items-center text-sm mb-4">
          <div>
            <span className="text-gray-400">From: </span>
            <span className="text-blue-400">{email.sender}</span>
          </div>
          <div className="text-gray-500">{formatDate(email.timestamp)}</div>
        </div>
        <div className="h-px bg-gradient-to-r from-blue-500/50 to-purple-500/50 mb-4"></div>
      </div>

      <div className="text-gray-300">
        {expanded ? (
          // Vollständiger E-Mail-Inhalt
          <div className="whitespace-pre-line">{email.content}</div>
        ) : (
          // Zusammenfassung
          <div>{summary}</div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              <span>Weniger anzeigen</span>
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              <span>Mehr anzeigen</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
