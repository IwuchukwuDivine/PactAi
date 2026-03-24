from fastapi import APIRouter, HTTPException, Header
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