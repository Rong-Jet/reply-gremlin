"use client"

import { Trash, Send, SkipForward, MailOpen } from "lucide-react"
import { CircularVoiceAssistant } from "./circular-voice-assistant"

interface ActionButtonsProps {
  onAction: (action: "delete" | "reply" | "skip" | "markUnread") => void
  isProcessing: boolean
  showResult: (result: any) => void
  onToggleConnection?: () => void
  isConnected?: boolean
  isListening?: boolean
}

export function ActionButtons({ 
  onAction, 
  isProcessing, 
  showResult, 
  onToggleConnection = () => {}, 
  isConnected = false,
  isListening = false
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col items-center w-full h-full justify-center">
      <div className="flex items-center justify-center mb-6">
        <CircularVoiceAssistant 
          size={100} 
          onToggleConnection={onToggleConnection}
          isConnected={isConnected}
          isListening={isListening}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mx-auto">
        <button
          onClick={() => onAction("delete")}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
        >
          <Trash size={16} />
          <span>Delete</span>
        </button>

        <button
          onClick={() => onAction("markUnread")}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
        >
          <MailOpen size={16} />
          <span>Mark Unread</span>
        </button>

        <button
          onClick={() => onAction("reply")}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        >
          <Send size={16} />
          <span>Reply</span>
        </button>

        <button
          onClick={() => onAction("skip")}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]"
        >
          <SkipForward size={16} />
          <span>Skip</span>
        </button>
      </div>
    </div>
  )
}
