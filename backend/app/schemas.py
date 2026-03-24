from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


# ── Shared sub-models ─────────────────────────────────────────────────────────

class Party(BaseModel):
    name: str
    role: Optional[str] = None
    contact: Optional[str] = None  # email or phone — not always a valid EmailStr


class DeliverableItem(BaseModel):
    items: list[str]
    revision_limit: Optional[int] = None
    exclusions: Optional[list[str]] = None


class MilestoneSplit(BaseModel):
    label: str
    amount: float
    trigger: str


class Payment(BaseModel):
    amount: float
    currency: str = "NGN"
    schedule: Optional[Literal["upfront", "on_delivery", "milestone", "split"]] = None
    milestone_split: Optional[list[MilestoneSplit]] = None


class Timeline(BaseModel):
    deadline: Optional[str] = None  # ISO 8601 date string, null if vague
    milestones: Optional[list[dict]] = None


class DefaultClause(BaseModel):
    service_provider_default: Optional[str] = None
    client_default: Optional[str] = None


class Ambiguity(BaseModel):
    phrase: str
    reason: str
    clarification_question: str


# ── extract-terms ─────────────────────────────────────────────────────────────

class ExtractTermsRequest(BaseModel):
    contract_id: str                          # used to write extracted_terms back to Supabase
    text: Optional[str] = None               # for paste input
    image_url: Optional[str] = None          # for screenshot input (Supabase Storage URL)
    input_type: Literal["paste", "screenshot", "manual"] = "paste"


class ExtractedTerms(BaseModel):
    service_provider: Party
    client: Party
    deliverables: DeliverableItem
    payment: Payment
    timeline: Timeline
    default_clause: Optional[DefaultClause] = None
    ambiguities: list[Ambiguity] = []


class ExtractTermsResponse(BaseModel):
    contract_id: str
    extracted_terms: ExtractedTerms


# ── send-signing-links ────────────────────────────────────────────────────────

class SendSigningLinksRequest(BaseModel):
    contract_id: str


class ClientSigningInfo(BaseModel):
    email: str
    signing_url: str
    token: str


class SendSigningLinksResponse(BaseModel):
    success: bool
    client: ClientSigningInfo
    service_provider: dict  # always {"note": "Signs in-app via authenticated session. No email sent."}


# ── Generic ───────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None