import type { Email } from "@/types/email"

export const mockEmails: Email[] = [
  {
    id: "1",
    sender: "John Smith <john.smith@example.com>",
    subject: "Project Status Update",
    content: `Hi Team,

I wanted to provide a quick update on the current project status. We've completed the initial phase and are now moving into development.

Key points:
- Frontend design is 90% complete
- Backend API endpoints are defined
- Database schema has been finalized

Please review the attached documents and provide your feedback by EOD tomorrow.

Best regards,
John`,
    timestamp: "2023-06-15T09:30:00Z",
    unread: false,
  },
  {
    id: "2",
    sender: "Marketing Team <marketing@example.com>",
    subject: "New Campaign Launch",
    content: `Hello everyone,

We're excited to announce the launch of our new marketing campaign next week. This initiative will focus on our latest product features and target our core demographic.

Campaign details:
- Launch date: June 20th
- Primary channels: Social media, email, and partner websites
- Key messaging: "Transform Your Workflow"

The creative assets are available in the shared drive. Please familiarize yourself with the materials before the all-hands meeting on Friday.

Regards,
Marketing Team`,
    timestamp: "2023-06-14T16:45:00Z",
    unread: true,
  },
  {
    id: "3",
    sender: "Sarah Johnson <sarah.j@example.com>",
    subject: "Meeting Rescheduled",
    content: `Hi there,

Due to some unforeseen circumstances, we need to reschedule tomorrow's quarterly review meeting.

The new details are:
- Date: June 18th
- Time: 2:00 PM - 3:30 PM
- Location: Main Conference Room
- Zoom link: https://example.zoom.us/j/123456789

Please let me know if this new time works for you. If not, we can look at alternative options.

Thanks for your understanding,
Sarah`,
    timestamp: "2023-06-14T11:20:00Z",
    unread: false,
  },
  {
    id: "4",
    sender: "Tech Support <support@example.com>",
    subject: "Your Recent Support Ticket #45678",
    content: `Dear User,

Thank you for contacting our support team. We've received your ticket regarding the login issues you've been experiencing.

Our technical team has investigated the matter and found that the issue was related to a recent server update. We've implemented a fix that should resolve your problem.

Please try logging in again and let us know if you continue to experience any issues.

Best regards,
Tech Support Team`,
    timestamp: "2023-06-13T14:15:00Z",
    unread: true,
  },
  {
    id: "5",
    sender: "Alex Chen <alex.chen@example.com>",
    subject: "Invitation: Product Demo",
    content: `Hello,

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
    timestamp: "2023-06-12T10:00:00Z",
    unread: false,
  },
]
