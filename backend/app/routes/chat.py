from fastapi import APIRouter, HTTPException
from app.schemas import ChatRequest, ChatResponse
from app import services

router = APIRouter()


@router.post("/chat", summary="Chat with PactAI assistant")
async def chat_endpoint(request: ChatRequest):
    try:
        result = await services.chat(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))