import os
import traceback
from fastapi import APIRouter, Response
import httpx
from agents import Agent, Runner
from app.gmail_server import initialize_gmail_server
from app.constants import INIT_AGENT_INSTRUCTIONS

router = APIRouter()

MODEL = "gpt-4o-realtime-preview"
VOICE = "coral" 

@router.get("")
async def get_session():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return Response(content='{"error": "OPENAI_API_KEY not set"}', status_code=500, media_type="application/json")
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "voice": VOICE,
                },
            )
        return Response(content=r.text, status_code=200, media_type="application/json")
    except Exception as e:
        return Response(content=f'{{"error": "{str(e)}"}}', status_code=500, media_type="application/json")

@router.get("/get-mails")
async def get_mails():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return Response(content='{"error": "OPENAI_API_KEY not set"}', status_code=500, media_type="application/json")
    
    try:
        # Initialize MCP server using the helper function
        mcp_server = await initialize_gmail_server()

        # Initialize agent with Gmail-specific instructions
        agent = Agent(
            name="Gmail Assistant",
            instructions="You are a helpful assistant that interacts with Gmail. Use the provided tools to help the user manage their Gmail account.",
            mcp_servers=[mcp_server],
        )

        # Get the last 5 emails with all required information
        result = await Runner.run(
            starting_agent=agent,
            input=INIT_AGENT_INSTRUCTIONS
        )

        # Cleanup MCP server
        await mcp_server.__aexit__(None, None, None)

        return Response(content=result.final_output, status_code=200, media_type="application/json")
    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"Error in get_mails: {str(e)}")
        print("Full error traceback:")
        print(error_traceback)
        return Response(
            content=f'{{"error": "{str(e)}", "traceback": "{error_traceback.replace(chr(34), chr(39))}"}}',
            status_code=500,
            media_type="application/json"
        ) 