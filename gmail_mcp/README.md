# MCP Gmail Example

This example demonstrates how to use the [Gmail MCP Server](https://github.com/GongRzhe/Gmail-MCP-Server) with the OpenAI Agents SDK to create an agent that can interact with Gmail.

## Features

This example showcases how to:

- Connect to the Gmail MCP Server
- List available tools for Gmail interaction
- View recent emails in your inbox
- Run custom Gmail-related queries through the agent

## Prerequisites

1. Node.js and npm installed
2. A Google account with Gmail
3. Python 3.10 or higher
4. OpenAI API key set in your environment
5. Google Cloud Platform OAuth credentials

## Setup

### 1. Install Node.js and npm

If not already installed, download and install from [nodejs.org](https://nodejs.org/).

### 2. Install the Gmail MCP Server

```bash
npm install -g @gongrzhe/server-gmail-autoauth-mcp
```

### 3. Set up Google Cloud Platform OAuth Credentials

The Gmail MCP Server requires OAuth credentials to access your Gmail account.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the Gmail API for your project
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" and select "OAuth client ID"
   - Select "Desktop application" as the application type
   - Name your OAuth client
   - Click "Create"
5. Download the credentials JSON file
6. Rename the downloaded file to `gcp-oauth.keys.json`
7. Place this file in one of these locations:
   - In the current directory where you run the script
   - In the `~/.gmail-mcp/` directory (create this directory if it doesn't exist)

### 4. Run the example
Or with uv:

```bash
uv run --python=3.12 python gmail_mcp/main.py
```

## Authentication Process

On first run, the Gmail MCP Server will:
1. Open your default browser
2. Ask you to log in to your Google account
3. Request permission to access your Gmail account
4. Store access tokens locally for future use

You may see a "Google hasn't verified this app" screen since you're using your own OAuth credentials. Click "Advanced" and "Go to [Your Project Name] (unsafe)" to proceed.

## Available Tools

The Gmail MCP Server provides tools for:

- Sending emails
- Reading emails
- Searching emails
- Managing labels
- Creating drafts
- And more!

## Example Queries

Here are some example queries you can try with the agent:

- "Search for emails from a specific sender"
- "Create a draft email to my colleague about the meeting tomorrow"
- "List all my email labels"
- "Show me unread emails from last week"
- "Create a new label called 'Important Projects'"

## Security Note

The Gmail MCP Server uses OAuth2 for authentication and stores your credentials locally. Please review the [security information](https://github.com/GongRzhe/Gmail-MCP-Server#security-notes) in the GitHub repository.

## Troubleshooting

If you encounter issues:

1. Ensure your OAuth credentials file is properly named and located
2. Check that you've enabled the Gmail API in your Google Cloud project
3. Make sure you've installed the Gmail MCP Server globally
4. Try running `npx @gongrzhe/server-gmail-autoauth-mcp` directly to test the server 