from fastapi import APIRouter, HTTPException, Header
from app import services
from app.schemas import ChatRequest, ChatResponse, ChatsResponse

router = APIRouter()


@router.post("/chat", summary="Chat with PactAI assistant")
async def chat_endpoint(request: ChatRequest):
    try:
        result = await services.chat(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chats", summary="List chat summaries for owner")
def list_chats(x_owner_id: str = Header(..., alias="x-owner-id")):
    try:
        chats = services.get_chats(x_owner_id)
        return {"chats": chats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history", summary="Alias for chat history")
def chat_history(x_owner_id: str = Header(..., alias="x-owner-id")):
    try:
        chats = services.get_chats(x_owner_id)
        return {"chats": chats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contracts/{contract_id}/messages", summary="Get messages for a contract")
def get_messages(contract_id: str, x_owner_id: str = Header(..., alias="x-owner-id")):
    try:
        # service will enforce owner scoping via RLS / queries
        messages = services.get_messages(contract_id)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/{chat_id}/messages", summary="Alias for getting messages for a chat")
def chat_messages(chat_id: str, x_owner_id: str = Header(..., alias="x-owner-id")):
    try:
        messages = services.get_messages(chat_id)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
