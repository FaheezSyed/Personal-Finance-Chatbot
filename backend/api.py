from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sql_agent import build_agent
from memory import Memory

app = FastAPI(title="Finance Chatbot API")

# CORS (adjust for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mem = Memory()

class ChatRequest(BaseModel):
    session_id: str
    message: str
    # optional personalization overrides
    name: Optional[str] = None
    currency: Optional[str] = None  # e.g., "INR"

class ChatResponse(BaseModel):
    reply: str
    memory: Dict[str, Any]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        agent = build_agent()
        if agent is None:
            raise HTTPException(status_code=500, detail="Agent failed to initialize.")

        # Update preferences if provided
        if req.name:
            mem.set_pref(req.session_id, "name", req.name)
        if req.currency:
            mem.set_pref(req.session_id, "currency", req.currency)

        # Compose system memory context (very lightweight)
        prefs = mem.get_prefs(req.session_id)
        history = mem.get_history(req.session_id)
        persona = []
        if prefs.get("name"):
            persona.append(f"User prefers to be addressed as {prefs['name']}.")
        if prefs.get("currency"):
            persona.append(f"Default currency is {prefs['currency']}.")
        persona.append("If user asks about their data, use the SQL DB via the SQL tool. Keep answers concise, INR by default.")

        # Prepend memory context to the user message for better grounding
        prompt = "\n".join([
            "Context:",
            "\n".join(persona),
            "Conversation (latest first):",
            "\n".join([f"User: {h['user']}\nBot: {h['bot']}" for h in history[-6:]]),
            "\nUser message:",
            req.message
        ])

        result = agent.invoke(prompt)
        #print("++++++", result, "++++++")
        # Normalise agent output
        reply = result if isinstance(result, str) else str(result['output'])

        # Save to memory
        mem.add_turn(req.session_id, user=req.message, bot=reply)

        return ChatResponse(reply=reply, memory=mem.snapshot(req.session_id))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {e}")

class RememberRequest(BaseModel):
    session_id: str
    key: str
    value: Any

@app.post("/remember")
def remember(req: RememberRequest):
    mem.set_pref(req.session_id, req.key, req.value)
    return {"ok": True, "memory": mem.snapshot(req.session_id)}

@app.get("/memory/{session_id}")
def get_memory(session_id: str):
    return mem.snapshot(session_id)