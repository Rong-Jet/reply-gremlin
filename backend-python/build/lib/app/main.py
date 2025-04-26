import os
from fastapi import FastAPI
from dotenv import load_dotenv
from app.routes import session

load_dotenv()

app = FastAPI()

app.include_router(session.router, prefix="/session")

@app.get("/")
def root():
    return {"status": "ok"} 