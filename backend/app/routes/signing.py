from fastapi import APIRouter, HTTPException
from app.schemas import SendSigningLinksRequest, SendSigningLinksResponse
from app import services

router = APIRouter()


@router.post("/send-links", summary="Send signing link to client")
async def send_signing_links(request: SendSigningLinksRequest):
    """
    Moves contract to pending_signatures and emails the client
    their signing link. Service provider signs in-app — no email sent to them.
    """
    try:
        result = await services.send_signing_links(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))