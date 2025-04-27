"use client"

import { useState } from "react"
import type { Email } from "@/types/email"
import { formatDate } from "@/lib/utils"
import { ChevronDown, ChevronUp, Paperclip, CornerUpRight } from "lucide-react"

interface EmailDisplayProps {
  email: Email | null
}

export function EmailDisplay({ email }: EmailDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  if (!email) {
    return <div className="flex items-center justify-center h-full text-gray-500">No email selected</div>
  }

  // Use the provided summary or create one from the content
  const contentSummary = email.summary || (email.email_content.substring(0, 100) + (email.email_content.length > 100 ? "..." : ""))

  const hasAttachments = email.attachments && email.attachments.length > 0

  return (
    <div className="p-6 h-[calc(100%-3.5rem)] overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{email.subject}</h3>
        <div className="flex justify-between items-center text-sm mb-4">
          <div>
            <span className="text-gray-400">From: </span>
            <span className="text-blue-400">{email.sender}</span>
          </div>
          <div className="text-gray-500">{formatDate(email.received_date)}</div>
        </div>
        {email.recipients && email.recipients.length > 0 && (
          <div className="text-sm mb-4">
            <span className="text-gray-400">To: </span>
            <span className="text-blue-400">{email.recipients.join(", ")}</span>
          </div>
        )}
        {email.replied && (
          <div className="mb-4 p-2 bg-blue-900/20 border border-blue-800/30 rounded-md">
            <div className="flex items-center gap-2 text-sm mb-2">
              <CornerUpRight size={16} className="text-blue-400" />
              <span className="text-blue-300 font-medium">You replied to this email</span>
            </div>
            {email.lastReply && (
              <div className="text-sm text-gray-300 pl-6 border-l-2 border-blue-800/30">
                {email.lastReply}
              </div>
            )}
          </div>
        )}
        <div className="h-px bg-gradient-to-r from-blue-500/50 to-purple-500/50 mb-4"></div>
      </div>

      {hasAttachments && (
        <div className="mb-4 p-3 bg-gray-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip size={16} className="text-gray-400" />
            <span className="text-gray-300 text-sm font-medium">Attachments</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {email.attachments.map((attachment, index) => (
              <div key={index} className="p-2 bg-gray-700 rounded flex items-center gap-2">
                <Paperclip size={14} className="text-blue-400" />
                <span className="text-sm text-gray-300 truncate">{attachment.filename}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-gray-300">
        {expanded ? (
          // Full email content
          <div className="whitespace-pre-line">{email.email_content}</div>
        ) : (
          // Summary
          <div>{contentSummary}</div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              <span>Show summary</span>
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              <span>Show full email</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
