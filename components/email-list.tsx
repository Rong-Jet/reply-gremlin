"use client"

import type { Email } from "@/types/email"
import { formatDate } from "@/lib/utils"

interface EmailListProps {
  emails: Email[]
  selectedEmailId: string
  onSelectEmail: (email: Email) => void
}

export function EmailList({ emails, selectedEmailId, onSelectEmail }: EmailListProps) {
  return (
    <div className="overflow-y-auto h-[calc(100%-3.5rem)]">
      {emails.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">No emails in inbox</div>
      ) : (
        <ul className="divide-y divide-gray-800">
          {emails.map((email) => (
            <li
              key={email.id}
              onClick={() => onSelectEmail(email)}
              className={`p-4 cursor-pointer transition-colors duration-200 hover:bg-gray-800 ${
                email.id === selectedEmailId ? "bg-gray-800 border-l-4 border-blue-500" : ""
              } ${email.unread ? "bg-gray-900/80" : ""}`}
              style={{ height: "96px" }}
            >
              <div className="flex justify-between items-start">
                <div className={`font-medium ${email.unread ? "text-blue-400 font-semibold" : "text-gray-200"}`}>
                  {email.sender}
                  {email.unread && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>}
                </div>
                <div className="text-xs text-gray-500">{formatDate(email.timestamp)}</div>
              </div>
              <div className={`text-sm mt-1 truncate ${email.unread ? "font-medium text-gray-200" : "text-gray-300"}`}>
                {email.subject}
              </div>
              <div className="text-xs text-gray-500 mt-1 truncate">{email.content.substring(0, 60)}...</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
