# Gmail MCP Backend

This is a Python FastAPI backend that provides a WebSocket endpoint for the Gmail MCP server integration.

## Prerequisites

1. **Install [uv](https://github.com/astral-sh/uv):**
   ```sh
   pip install uv
   ```

2. **Install Node.js and npm:**
   - Download from: https://nodejs.org/
   - Required for the Gmail MCP server

3. **Install Gmail MCP Server:**
   ```sh
   npm install -g @gongrzhe/server-gmail-autoauth-mcp
   ```

4. **Set up Google Cloud OAuth:**
   - Create a Google Cloud Platform (GCP) project
   - Enable the Gmail API
   - Create OAuth 2.0 credentials
   - Download the credentials as `gcp-oauth.keys.json`
   - Place this file in either:
     - `~/.gmail-mcp/gcp-oauth.keys.json` or
     - Current directory as `gcp-oauth.keys.json`

## Run the server

Single command to create virtual environment, install dependencies, and start the server:

```sh
uv run uvicorn app.gmail_server:app --reload
```

This will:
- Create and activate a virtual environment if it doesn't exist
- Install all required packages
- Start the FastAPI server with hot reload

## Endpoints

- `WebSocket /ws/gmail` — WebSocket endpoint for Gmail MCP server communication

---

**Note:** This project uses FastAPI with WebSocket support for real-time communication with the Gmail MCP server. 