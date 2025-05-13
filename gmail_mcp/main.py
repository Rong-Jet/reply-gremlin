import asyncio
import os
import platform
import shutil
import sys
import warnings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from agents import Agent, Runner, gen_trace_id, trace
from agents.mcp import MCPServer, MCPServerStdio


# Suppress the specific Windows asyncio warnings about closed pipes
if platform.system() == 'Windows':
    warnings.filterwarnings("ignore", message=".*I/O operation on closed pipe.*")
    warnings.filterwarnings("ignore", message=".*unclosed transport.*")


async def run(mcp_server: MCPServer):
    agent = Agent(
        name="Gmail Assistant",
        instructions="You are a helpful assistant that interacts with Gmail. Use the provided tools to help the user manage their Gmail account.",
        mcp_servers=[mcp_server],
    )

    # Get unread emails with summaries
    message = "Get all unread emails and generate a summary for each one. Return the results as JSON including both the email data and summaries."
    print("\n" + "-" * 40)
    print(f"Running: {message}")
    result = await Runner.run(
        starting_agent=agent,
        input=message
    )
    print(result.final_output)
    # TODO: Debug or output what the agent is doing (tool calls, etc.)

    # List available tools
    message = "What tools are available for Gmail? Please list them."
    print("\n" + "-" * 40)
    print(f"Running: {message}")
    result = await Runner.run(
        starting_agent=agent, 
        input=message
    )
    print(result.final_output)

    # Check inbox
    message = "Show me the subject lines of my 5 most recent emails in my inbox."
    print("\n" + "-" * 40)
    print(f"Running: {message}")
    result = await Runner.run(
        starting_agent=agent, 
        input=message
    )
    print(result.final_output)

    # Custom user query
    user_query = input("\nEnter your Gmail-related query (or press Enter to quit): ")
    if user_query:
        print("\n" + "-" * 40)
        print(f"Running: {user_query}")
        result = await Runner.run(
            starting_agent=agent, 
            input=user_query
        )
        print(result.final_output)


async def main():
    trace_id = gen_trace_id()
    
    # Check if OAuth credentials file exists
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
        sys.exit(1)
    
    try:
        print("Initializing Gmail MCP Server... This may take a moment for first-time authentication.")
        print("A browser window should open for Google authentication. Please log in and grant permissions.")
        
        async with MCPServerStdio(
            name="Gmail MCP Server",
            cache_tools_list=True,  # Cache the tools list for better performance
            params={
                "command": "npx",
                "args": ["@gongrzhe/server-gmail-autoauth-mcp"],
            },
            client_session_timeout_seconds=60,  # Increase timeout for authentication
        ) as server:
            with trace(workflow_name="MCP Gmail Example", trace_id=trace_id):
                print(f"View trace: https://platform.openai.com/traces/trace?trace_id={trace_id}\n")
                await run(server)
    except Exception as e:
        print(f"Error: {e}")
        print("\nTroubleshooting suggestions:")
        print("1. Make sure you have installed the Gmail MCP Server: npm install -g @gongrzhe/server-gmail-autoauth-mcp")
        print("2. Ensure your OAuth credentials file is properly configured")
        print("3. Check your internet connection")
        print("4. For Windows users, ensure you have the necessary permissions to run NPM packages")
        sys.exit(1)


def run_async():
    # Configure Windows-specific asyncio settings
    if platform.system() == 'Windows':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    asyncio.run(main())


if __name__ == "__main__":
    # Check if npx is installed
    if not shutil.which("npx"):
        print("Error: npx is not installed. Please install Node.js and npm first.")
        print("You can download them from: https://nodejs.org/")
        sys.exit(1)
    
    run_async() 