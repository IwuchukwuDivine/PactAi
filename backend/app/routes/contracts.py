from fastapi import APIRouter, HTTPException, Header, Query
from app.schemas import (
    ExtractTermsRequest,
    ExtractTermsResponse,
    ErrorResponse,
)
from app import services

router = APIRouter()


@router.post("/", summary="Create a new contract")
def create_contract(data: dict, owner_id: str = Header(..., alias="x-owner-id")):
    """
    Creates a contract row in draft status.
    owner_id is passed as a header — in production this comes from
    the Supabase JWT decoded by your auth middleware.
    """
    try:
        contract = services.create_contract(owner_id=owner_id, data=data)
        return contract
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{contract_id}", summary="Get a contract by ID")
def get_contract(contract_id: str):
    contract = services.get_contract(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.get("/", summary="List contracts for an owner")
def list_contracts(owner_id: str = Header(..., alias="x-owner-id")):
    try:
        contracts = services.get_contracts_by_owner(owner_id)
        return contracts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{contract_id}", summary="Update contract fields")
def update_contract(contract_id: str, data: dict):
    try:
        updated = services.update_contract(contract_id, data)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-terms", summary="Extract terms from raw input via Claude")
async def extract_terms(request: ExtractTermsRequest):
    """
    Calls the extract-terms edge function, then writes the result
    back to the contract row in Supabase.
    """
    try:
        result = await services.extract_terms(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{contract_id}/pdf", summary="Get contract PDF URL or presigned link")
def get_contract_pdf(contract_id: str, x_owner_id: str = Header(None, alias="x-owner-id"), signing_token: str | None = Query(None)):
    """Return the contract PDF URL. Owner header or valid signing_token required."""
    try:
        # Authorize: either owner or valid signing token
        if not x_owner_id and not signing_token:
            raise HTTPException(status_code=401, detail="Missing owner header or signing_token")

        # If signing_token provided, validate it belongs to a signature for this contract
        if signing_token:
            valid = services.validate_signing_token_for_contract(signing_token, contract_id)
            if not valid:
                raise HTTPException(status_code=403, detail="Invalid signing token for this contract")

        result = services.get_contract_pdf(contract_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))