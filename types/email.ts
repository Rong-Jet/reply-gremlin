export interface Attachment {
  filename: string
  mime_type: string
}

export interface Email {
  email_id: string
  sender: string
  recipients: string[]
  subject: string
  email_content: string
  received_date: string
  summary: string
  attachments: Attachment[]
  unread: boolean
  replied?: boolean
  lastReply?: string
}

export interface ActionResult {
  emailSubject: string
  action: "delete" | "reply" | "skip" | "markUnread"
  message: string
  replyText?: string
  pending?: boolean
}
