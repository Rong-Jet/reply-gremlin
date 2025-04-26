import asyncio
import os
import platform
import warnings
import traceback
from agents.mcp.server import MCPServerStdio

# Suppress Windows asyncio warnings about closed pipes
if platform.system() == 'Windows':
    warnings.filterwarnings("ignore", message=".*I/O operation on closed pipe.*")
    warnings.filterwarnings("ignore", message=".*unclosed transport.*")

async def initialize_gmail_server():
    """Initialize the Gmail MCP server with authentication."""
    try:
        print("Initializing Gmail MCP Server... This may take a moment for first-time authentication.")
        print("A browser window should open for Google authentication. Please log in and grant permissions.")
        
        server = await MCPServerStdio(
            name="Gmail MCP Server",
            cache_tools_list=True,  # Cache the tools list for better performance
            params={
                "command": "npx",
                "args": ["@gongrzhe/server-gmail-autoauth-mcp"],
            },
            client_session_timeout_seconds=60,  # Increase timeout for authentication
        ).__aenter__()
        
        return server
    except Exception as e:
        print(f"Error initializing Gmail server: {str(e)}")
        print("Full error traceback:")
        traceback.print_exc()
        raise 