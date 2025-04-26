import os
from fastapi import APIRouter, Response
import httpx

router = APIRouter()

MODEL = "your-model-name"  # TODO: Replace with actual model name
VOICE = "your-voice-name"  # TODO: Replace with actual voice name

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