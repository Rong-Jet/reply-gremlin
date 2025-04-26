export interface Email {
  id: string
  sender: string
  subject: string
  content: string
  timestamp: string
  unread: boolean
}

export interface ActionResult {
  emailSubject: string
  action: "delete" | "reply" | "skip" | "markUnread"
  message: string
  replyText?: string
  pending?: boolean
}
