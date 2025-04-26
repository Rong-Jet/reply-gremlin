import type { Email } from "@/types/email"
import { EmailList } from "./email-list"
import { ActionButtons } from "./action-buttons"

interface LeftPanelProps {
  emails: Email[]
  selectedEmailId: string
  onSelectEmail: (email: Email) => void
  onAction: (action: "delete" | "reply" | "skip" | "markUnread") => void
  isProcessing: boolean
  onToggleConnection?: () => void
  isConnected?: boolean
  isListening?: boolean
}

export function LeftPanel({ 
  emails, 
  selectedEmailId, 
  onSelectEmail, 
  onAction, 
  isProcessing, 
  onToggleConnection,
  isConnected,
  isListening
}: LeftPanelProps) {
  return (
    <div className="flex flex-col w-full md:w-2/5 gap-4 h-full">
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg h-[50%]">
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Inbox
          </h2>
        </div>
        <EmailList emails={emails} selectedEmailId={selectedEmailId} onSelectEmail={onSelectEmail} />
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg h-[50%] mt-4">
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            AI Actions
          </h2>
        </div>
        <div className="p-4 h-[calc(100%-3.5rem)] flex items-center justify-center">
          <ActionButtons 
            onAction={onAction} 
            isProcessing={isProcessing} 
            showResult={() => {}}
            onToggleConnection={onToggleConnection}
            isConnected={isConnected}
            isListening={isListening}
          />
        </div>
      </div>
    </div>
  )
}
