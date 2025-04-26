"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Check, XIcon } from "lucide-react"
import type { ActionResult } from "@/types/email"

interface InlineResultProps {
  result: ActionResult | null
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  onReplyTextChange?: (text: string) => void
}

export function InlineResult({ result, onClose, onConfirm, onCancel, onReplyTextChange }: InlineResultProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [replyText, setReplyText] = useState("")

  useEffect(() => {
    if (result) {
      // Animation delay for entrance
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 10)

      // Set initial reply text
      if (result.replyText) {
        setReplyText(result.replyText)
      }

      return () => clearTimeout(timer)
    }
  }, [result])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for exit animation
  }

  const handleReplyTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setReplyText(newText)
    if (onReplyTextChange) {
      onReplyTextChange(newText)
    }
  }

  if (!result) return null

  return (
    <div
      className="bg-gray-800/90 border border-gray-700 rounded-lg shadow-lg overflow-hidden transition-all duration-300 mb-4"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(10px)",
        boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
      }}
    >
      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          AI Assistant Result
        </h3>
        <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        <h4 className="text-base font-bold text-white mb-2">{result.emailSubject}</h4>
        <div className="text-sm text-gray-300 mb-2">{result.message}</div>

        {result.action === "reply" && (
          <div className="mt-3 p-3 bg-gray-900 rounded-md border border-gray-700 text-sm">
            <h5 className="text-xs font-medium text-gray-400 mb-1">Suggested Reply:</h5>
            <textarea
              value={replyText}
              onChange={handleReplyTextChange}
              className="w-full bg-gray-800 text-gray-300 p-2 rounded border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[100px] resize-y"
            />
          </div>
        )}

        {result.pending && (
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center gap-2 text-sm transition-colors"
            >
              <XIcon size={14} />
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-2 text-sm transition-colors"
            >
              <Check size={14} />
              Bestätigen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
