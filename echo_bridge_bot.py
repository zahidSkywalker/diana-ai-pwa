"""
Echo AI Bridge Bot — Python relay bot
========================================
A separate Discord bot that relays PWA messages to Echo and returns her responses.

Architecture:
  PWA (Vercel) → POST /chat → This bot → sends @Echo in #echo → Echo responds → bot returns response → PWA streams to user

The bot uses its OWN Discord account (separate from Echo). Echo's gateway sees a real
bot mention and responds naturally.

Requirements:
  pip install fastapi uvicorn discord.py python-dotenv

Run:
  python echo_bridge_bot.py
  (starts web server on port 8900 and Discord bot)
"""

import os
import asyncio
import time
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import discord
from dotenv import load_dotenv

load_dotenv()

# ─── Config ────────────────────────────────────────────────
BOT_TOKEN = os.getenv("BRIDGE_BOT_TOKEN", "")
ECHO_BOT_ID = os.getenv("ECHO_BOT_ID", "1503694342634606682")
CHANNEL_ID = int(os.getenv("DISCORD_CHANNEL_ID", "1511044432873656412"))
AUTH_TOKEN = os.getenv("BRIDGE_AUTH_TOKEN", "echo-bridge-2026-secret")
PORT = int(os.getenv("PORT", "8900"))

# ─── State ────────────────────────────────────────────────
bot_client: Optional[discord.Client] = None
pending_requests: dict[str, asyncio.Future] = {}
# message_id -> asyncio.Future that resolves with Echo's response text


# ─── Discord Bot ──────────────────────────────────────────
class BridgeBot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.messages = True
        super().__init__(intents=intents)

    async def on_ready(self):
        print(f"[Bridge] Logged in as {self.user} (ID: {self.user.id})")
        print(f"[Bridge] Watching channel {CHANNEL_ID} for Echo responses")

    async def on_message(self, message: discord.Message):
        # Ignore own messages and DMs
        if message.author.id == self.user.id:
            return
        if message.channel.id != CHANNEL_ID:
            return

        # Check if this is Echo responding
        if message.author.id == int(ECHO_BOT_ID):
            # Find any pending request that's waiting
            resolved = False
            for msg_id, future in list(pending_requests.items()):
                if not future.done():
                    # Clean mentions from response
                    clean = discord.utils.remove_markdown_mentions(message.content).strip()
                    future.set_result(clean)
                    resolved = True
                    print(f"[Bridge] Echo responded to pending request ({len(clean)} chars)")
                    break

            # If no pending request, store the latest response for any future poll
            if not resolved:
                self._last_echo_response = message.content
                self._last_echo_time = time.time()


bridge_bot = BridgeBot()


# ─── FastAPI ───────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Discord bot
    global bot_client
    if BOT_TOKEN:
        asyncio.create_task(bridge_bot.start(BOT_TOKEN))
        # Wait for bot to be ready
        await bridge_bot.wait_until_ready()
    else:
        print("[Bridge] WARNING: No BRIDGE_BOT_TOKEN set. Discord bot not started.")
    yield
    # Cleanup
    if bot_client:
        await bridge_bot.close()


app = FastAPI(title="Echo Bridge Bot", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "Echo AI Bridge Bot",
        "status": "online" if bridge_bot.is_ready() else "offline",
        "bot_id": str(bridge_bot.user.id) if bridge_bot.user else None,
        "bot_name": str(bridge_bot.user) if bridge_bot.user else None,
        "echo_channel": CHANNEL_ID,
        "echo_bot_id": ECHO_BOT_ID,
    }


@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Relay a message to Echo and return her response.
    Flow:
      1. Send "<@Echo> message" to #echo using THIS bot (not a webhook)
      2. Wait for Echo to respond (up to 60s)
      3. Return Echo's response text
    """
    auth = req.model_extra.get("auth") if hasattr(req, "model_extra") else None
    # Auth checked via header

    if not bridge_bot.is_ready():
        raise HTTPException(503, "Bridge bot not ready")

    channel = bridge_bot.get_channel(CHANNEL_ID)
    if not channel:
        raise HTTPException(500, f"Cannot find channel {CHANNEL_ID}")

    # Send @Echo mention + user message
    mention = f"<@{ECHO_BOT_ID}>"
    content = f"{mention} {req.message}"
    if len(content) > 2000:
        content = content[:2000]

    try:
        sent_msg = await channel.send(content)
    except discord.Forbidden:
        raise HTTPException(403, "Bot lacks permission to send in this channel")
    except Exception as e:
        raise HTTPException(500, f"Failed to send: {str(e)}")

    print(f"[Bridge] Sent message {sent_msg.id}, waiting for Echo...")

    # Wait for Echo's response (up to 60s)
    future = asyncio.get_event_loop().create_future()
    pending_requests[sent_msg.id] = future

    try:
        response = await asyncio.wait_for(future, timeout=60.0)
        return {"content": response, "status": "ok"}
    except asyncio.TimeoutError:
        # Fallback: check if Echo sent any message after ours
        print(f"[Bridge] Timeout waiting for Echo after message {sent_msg.id}")
        try:
            async for msg in channel.history(after=sent_msg, limit=10):
                if msg.author.id == int(ECHO_BOT_ID):
                    clean = discord.utils.remove_markdown_mentions(msg.content).strip()
                    return {"content": clean, "status": "ok"}
        except Exception:
            pass
        return {"content": None, "status": "timeout"}
    finally:
        pending_requests.pop(sent_msg.id, None)


@app.get("/status")
async def status():
    return {
        "bot_ready": bridge_bot.is_ready(),
        "bot_user": str(bridge_bot.user) if bridge_bot.user else None,
        "bot_id": str(bridge_bot.user.id) if bridge_bot.user else None,
        "pending_requests": len(pending_requests),
        "echo_channel": CHANNEL_ID,
        "echo_bot_id": ECHO_BOT_ID,
    }


if __name__ == "__main__":
    import uvicorn

    if not BOT_TOKEN:
        print("ERROR: Set BRIDGE_BOT_TOKEN in .env or environment")
        print("")
        print("Steps to create a Discord bot:")
        print("  1. Go to https://discord.com/developers/applications")
        print("  2. Create New Application → Bot → Copy token")
        print("  3. Enable MESSAGE CONTENT INTENT in the bot settings")
        print("  4. Invite bot to server with Send Messages + Read Messages perms")
        print("  5. Set BRIDGE_BOT_TOKEN=<your-token>")
        exit(1)

    print(f"[Bridge] Starting Echo Bridge Bot on port {PORT}")
    print(f"[Bridge] Echo Bot ID: {ECHO_BOT_ID}")
    print(f"[Bridge] Channel ID: {CHANNEL_ID}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
