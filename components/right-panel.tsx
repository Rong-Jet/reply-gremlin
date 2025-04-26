"use client"

import type { Email, ActionResult } from "@/types/email"
import { EmailDisplay } from "./email-display"
import { InlineResult } from "./inline-result"

interface RightPanelProps {
  selectedEmail: Email | null
  isProcessing: boolean
  actionResult: ActionResult | null
  onCloseResult: () => void
  onConfirmAction: () => void
  onCancelAction: () => void
  onReplyTextChange?: (text: string) => void
}

export function RightPanel({
  selectedEmail,
  isProcessing,
  actionResult,
  onCloseResult,
  onConfirmAction,
  onCancelAction,
  onReplyTextChange,
}: RightPanelProps) {
  return (
    <div className="flex flex-col w-full md:w-3/5 h-full">
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg h-full">
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Selected Email
          </h2>
        </div>
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
          {actionResult && (
            <div className="p-4">
              <InlineResult
                result={actionResult}
                onClose={onCloseResult}
                onConfirm={onConfirmAction}
                onCancel={onCancelAction}
                onReplyTextChange={onReplyTextChange}
              />
            </div>
          )}
          <EmailDisplay email={selectedEmail} />
        </div>
      </div>
    </div>
  )
}
