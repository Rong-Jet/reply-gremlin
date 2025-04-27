import type { Email } from "@/types/email"

export const mockEmails: Email[] = [
  {
    email_id: "1",
    sender: "john.smith@example.com",
    recipients: ["team@example.com"],
    subject: "Project Status Update",
    email_content: `Hi Team,

I wanted to provide a quick update on the current project status. We've completed the initial phase and are now moving into development.

Key points:
- Frontend design is 90% complete
- Backend API endpoints are defined
- Database schema has been finalized

Please review the attached documents and provide your feedback by EOD tomorrow.

Best regards,
John`,
    received_date: "2023-06-15T09:30:00Z",
    summary: "Project status update showing 90% completion of frontend, defined API endpoints, and finalized database schema.",
    attachments: [
      {
        filename: "project_docs.pdf",
        mime_type: "application/pdf"
      }
    ],
    unread: false,
  },
  {
    email_id: "2",
    sender: "marketing@example.com",
    recipients: ["all-staff@example.com"],
    subject: "New Campaign Launch",
    email_content: `Hello everyone,

We're excited to announce the launch of our new marketing campaign next week. This initiative will focus on our latest product features and target our core demographic.

Campaign details:
- Launch date: June 20th
- Primary channels: Social media, email, and partner websites
- Key messaging: "Transform Your Workflow"

The creative assets are available in the shared drive. Please familiarize yourself with the materials before the all-hands meeting on Friday.

Regards,
Marketing Team`,
    received_date: "2023-06-14T16:45:00Z",
    summary: "Announcement of new marketing campaign launching June 20th with the message 'Transform Your Workflow'.",
    attachments: [],
    unread: true,
  },
  {
    email_id: "3",
    sender: "sarah.j@example.com",
    recipients: ["you@example.com"],
    subject: "Meeting Rescheduled",
    email_content: `Hi there,

Due to some unforeseen circumstances, we need to reschedule tomorrow's quarterly review meeting.

The new details are:
- Date: June 18th
- Time: 2:00 PM - 3:30 PM
- Location: Main Conference Room
- Zoom link: https://example.zoom.us/j/123456789

Please let me know if this new time works for you. If not, we can look at alternative options.

Thanks for your understanding,
Sarah`,
    received_date: "2023-06-14T11:20:00Z",
    summary: "Quarterly review meeting rescheduled to June 18th, 2-3:30 PM in the Main Conference Room.",
    attachments: [
      {
        filename: "calendar_invite.ics",
        mime_type: "text/calendar"
      }
    ],
    unread: false,
  },
  {
    email_id: "4",
    sender: "support@example.com",
    recipients: ["you@example.com"],
    subject: "Your Recent Support Ticket #45678",
    email_content: `Dear User,

Thank you for contacting our support team. We've received your ticket regarding the login issues you've been experiencing.

Our technical team has investigated the matter and found that the issue was related to a recent server update. We've implemented a fix that should resolve your problem.

Please try logging in again and let us know if you continue to experience any issues.

Best regards,
Tech Support Team`,
    received_date: "2023-06-13T14:15:00Z",
    summary: "Response to support ticket #45678 regarding login issues, which were caused by a server update and have been fixed.",
    attachments: [],
    unread: true,
  },
  {
    email_id: "5",
    sender: "alex.chen@example.com",
    recipients: ["partners@example.com"],
    subject: "Invitation: Product Demo",
    email_content: `Hello,

I'd like to invite you to an exclusive demo of our upcoming product features. As a valued partner, we want to give you a sneak peek before the public release.

Event details:
- Date: June 22nd
- Time: 11:00 AM - 12:00 PM
- Platform: Microsoft Teams

During this session, our product team will showcase the new capabilities and answer any questions you might have.

Looking forward to your participation!

Best,
Alex Chen
Product Manager`,
    received_date: "2023-06-12T10:00:00Z",
    summary: "Invitation to an exclusive product demo on June 22nd, 11 AM-12 PM via Microsoft Teams.",
    attachments: [
      {
        filename: "product_preview.pptx",
        mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      }
    ],
    unread: false,
  },
]
