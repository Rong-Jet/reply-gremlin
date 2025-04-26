import asyncio
import os
import platform
import warnings
import shutil
from fastapi import FastAPI, WebSocket
from agents.mcp.server import MCPServerStdio

# Suppress Windows asyncio warnings about closed pipes
if platform.system() == 'Windows':
    warnings.filterwarnings("ignore", message=".*I/O operation on closed pipe.*")
    warnings.filterwarnings("ignore", message=".*unclosed transport.*")

app = FastAPI()

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
        print(f"Error initializing Gmail server: {e}")
        raise

@app.websocket("/ws/gmail")
async def gmail_websocket(websocket: WebSocket):
    await websocket.accept()
    
    try:
        # Initialize the Gmail server
        server = await initialize_gmail_server()
        
        # Handle WebSocket communication
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                
                # Process the message through the Gmail server
                # You'll need to implement the specific message handling logic here
                # based on your application's needs
                
                # Send response back to client
                await websocket.send_text("Message received")
                
        except Exception as e:
            print(f"WebSocket error: {e}")
            
        finally:
            # Cleanup
            await server.__aexit__(None, None, None)
            
    except Exception as e:
        await websocket.send_text(f"Error: {str(e)}")
        await websocket.close()

# Check OAuth credentials on startup
def check_credentials():
    home_dir = os.path.expanduser("~")
    credentials_path = os.path.join(home_dir, ".gmail-mcp", "gcp-oauth.keys.json")
    current_dir_credentials = os.path.join(os.getcwd(), "gcp-oauth.keys.json")
    
    if not os.path.exists(credentials_path) and not os.path.exists(current_dir_credentials):
        print("Error: OAuth credentials file not found.")
        print("\nTo use this example, you need to:")
        print("1. Create a Google Cloud Platform (GCP) project")
        print("2. Enable the Gmail API")
        print("3. Create OAuth 2.0 credentials")
        print("4. Download the credentials as 'gcp-oauth.keys.json'")
        print("5. Place this file in the current directory or in ~/.gmail-mcp/")
        print("\nFor detailed instructions, visit: https://github.com/GongRzhe/Gmail-MCP-Server#setup")
        return False
    return True

@app.on_event("startup")
async def startup_event():
    # Check for npx
    if not shutil.which("npx"):
        print("Error: npx is not installed. Please install Node.js and npm first.")
        print("You can download them from: https://nodejs.org/")
        exit(1)
    
    # Check credentials
    if not check_credentials():
        exit(1) 