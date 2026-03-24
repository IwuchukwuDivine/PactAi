from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import contracts, signing, milestones, health

app = FastAPI(
    title="PactAI API",
    description="Backend for PactAI — AI-powered contract and escrow management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
app.include_router(signing.router, prefix="/signing", tags=["Signing"])
app.include_router(milestones.router, prefix="/milestones", tags=["Milestones"])