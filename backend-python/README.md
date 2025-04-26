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

Start the FastAPI server:

```sh
uv run uvicorn app.main:app
```

**Important Note:** If you encounter a `NotImplementedError` from asyncio (common on Windows with Python 3.12), do not use the `--reload` flag. The error occurs because of asyncio subprocess limitations in Python 3.12 on Windows. Running without `--reload` resolves this issue.

## Endpoints

- `GET /session/get-mails` — Fetch and summarize recent emails
- `GET /session` — Get OpenAI session information

---

**Note:** This project uses FastAPI for real-time communication with the Gmail MCP server. 