# FastAPI Session Backend

This is a Python FastAPI backend that provides a `/session` endpoint, translating the logic from the original TypeScript route.

## Setup

0. **Activate virtual environment:**
   ```sh
   source .venv/bin/activate
   ```

1. **Install [uv](https://github.com/astral-sh/uv):**
   ```sh
   pip install uv
   ```

2. **Install dependencies:**
   ```sh
   uv pip install .
   ```

3. **Copy and edit the environment file:**
   ```sh
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Edit `MODEL` and `VOICE` in `app/routes/session.py` as needed.**

## Run the server

```sh
uvicorn app.main:app --reload
```

## Endpoint

- `GET /session` — Returns a session token from OpenAI's realtime API.

---

**Note:** This project uses FastAPI, httpx, and python-dotenv. The package manager is [uv](https://github.com/astral-sh/uv) for fast installs. 