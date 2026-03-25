from fastapi import APIRouter, HTTPException, Header, Body
from datetime import datetime
from app import services

router = APIRouter()


@router.post("/contracts/{contract_id}/signatures/{signature_id}/decline", summary="Decline a signature link")
def decline_signature(contract_id: str, signature_id: str, payload: dict = Body(...)):
    reason = payload.get("reason") or payload.get("rejection_note")
    if not reason:
        raise HTTPException(status_code=400, detail="Missing rejection reason")
    try:
        result = services.decline_signature(contract_id, signature_id, reason)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))