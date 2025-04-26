// Email-related tools for the OpenAI Realtime API
export const EMAIL_TOOLS = [
  {
    type: "function",
    name: "get_emails",
    description: "Get a list of emails from the user's inbox",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of emails to retrieve",
        },
        filter: {
          type: "string",
          description: "Optional filter for emails (e.g., 'unread', 'important')",
        },
      },
      required: ["limit"],
    },
  },
  {
    type: "function",
    name: "read_email",
    description: "Read the content of a specific email",
    parameters: {
      type: "object",
      properties: {
        email_id: {
          type: "string",
          description: "ID of the email to read",
        },
      },
      required: ["email_id"],
    },
  },
  {
    type: "function",
    name: "send_reply",
    description: "Send a reply to a specific email",
    parameters: {
      type: "object",
      properties: {
        email_id: {
          type: "string",
          description: "ID of the email to reply to",
        },
        message: {
          type: "string",
          description: "Content of the reply",
        },
      },
      required: ["email_id", "message"],
    },
  },
  {
    type: "function",
    name: "delete_email",
    description: "Delete a specific email",
    parameters: {
      type: "object",
      properties: {
        email_id: {
          type: "string",
          description: "ID of the email to delete",
        },
      },
      required: ["email_id"],
    },
  },
  // New Gmail API tools
  {
    type: "function",
    name: "search_mails",
    description: "Search for emails using Gmail's search syntax",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query using Gmail's search operators (e.g., 'from:example@gmail.com', 'subject:hello', 'is:unread')",
        },
        max_results: {
          type: "integer",
          description: "Maximum number of emails to retrieve (default: 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "read_mail",
    description: "Get detailed information about a specific email including its content",
    parameters: {
      type: "object",
      properties: {
        message_id: {
          type: "string",
          description: "ID of the email to read",
        },
      },
      required: ["message_id"],
    },
  },
];

// Keep the original MCP_SERVER for backward compatibility
export const MCP_SERVER = {
    name: "Gmail Assistant",
    instructions: "You are a helpful assistant that interacts with Gmail. Use the provided tools to help the user manage their Gmail account.",
    // url: "http://localhost:8000/mcp"
}; 