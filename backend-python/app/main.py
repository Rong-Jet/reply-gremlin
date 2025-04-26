import os
import shutil
from fastapi import FastAPI, WebSocket
from dotenv import load_dotenv
from app.routes import session

load_dotenv()

app = FastAPI()

app.include_router(session.router, prefix="/session")

@app.get("/")
def root():
    return {"status": "ok"}

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