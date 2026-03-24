from fastapi import APIRouter, HTTPException
from app import services

router = APIRouter()


@router.get("/{contract_id}", summary="List milestones for a contract")
def get_milestones(contract_id: str):
    try:
        milestones = services.get_milestones(contract_id)
        return milestones
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", summary="Create a milestone")
def create_milestone(data: dict):
    try:
        milestone = services.create_milestone(data)
        return milestone
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))