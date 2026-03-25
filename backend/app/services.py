import httpx
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.supabase_client import get_supabase
from app.config import get_settings
from app.schemas import (
    ExtractTermsRequest,
    ExtractTermsResponse,
    ExtractedTerms,
    SendSigningLinksRequest,
    SendSigningLinksResponse,
    ClientSigningInfo,
)

settings = get_settings()
supabase = get_supabase()


# ── Email ─────────────────────────────────────────────────────────────────────

def send_email(to: str, subject: str, html: str) -> None:
    """
    Sends an HTML email via Gmail SMTP.
    Credentials are loaded from .env — never hardcoded.
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"PactAI <{settings.gmail_address}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.gmail_address, settings.gmail_app_password)
        server.sendmail(settings.gmail_address, to, msg.as_string())


def build_signing_email(
    client_name: str,
    sp_name: str,
    contract_title: str,
    signing_url: str,
    escrow_proposed: bool,
    payment: dict | None,
    edit_note: str | None,
    notify_party_b: bool,
) -> str:
    escrow_section = ""
    if escrow_proposed:
        amount = payment.get("amount", "") if payment else ""
        currency = payment.get("currency", "NGN") if payment else "NGN"
        escrow_section = f"""
        <div style="background:#fff8e1;padding:16px;border:1px solid #f0c040;border-radius:6px;margin:20px 0;">
            <strong>Payment protection has been requested</strong>
            <p style="margin:8px 0 0;color:#444;">
                {sp_name} has asked that your payment of
                <strong>{currency} {amount:,}</strong>
                be held securely by PactAI until the work is delivered.
            </p>
            <p style="margin:8px 0 0;color:#444;">
                This means you pay upfront, but the money is not released to {sp_name}
                until you confirm the work is done. You can accept or decline this
                when you open your signing link.
            </p>
        </div>
        """

    edit_note_section = ""
    if edit_note and notify_party_b:
        edit_note_section = f"""
        <div style="background:#f5f5f5;padding:12px 16px;border-left:3px solid #888;margin:20px 0;border-radius:0 4px 4px 0;">
            <strong>Update from {sp_name}:</strong><br/>
            <span style="color:#444;">{edit_note}</span>
        </div>
        """

    return f"""
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;">
        <p>Hi {client_name},</p>
        <p><strong>{sp_name}</strong> has prepared a contract for you to review and sign.</p>
        <p><strong>Contract:</strong> {contract_title}</p>

        {escrow_section}
        {edit_note_section}

        <p style="margin:24px 0;">
            <a href="{signing_url}"
               style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:#fff;
                      text-decoration:none;border-radius:6px;font-weight:500;">
                Review &amp; Sign
            </a>
        </p>

        <p style="color:#888;font-size:12px;">
            This link expires in 7 days. You do not need an account to sign.
        </p>
    </div>
    """


# ── Contracts ─────────────────────────────────────────────────────────────────

def create_contract(owner_id: str, data: dict) -> dict:
    response = (
        supabase.table("contracts")
        .insert({
            "owner_id": owner_id,
            "title": data.get("title"),
            "raw_input": data.get("raw_input"),
            "input_type": data.get("input_type", "paste"),
            "screenshot_url": data.get("screenshot_url"),
            "escrow_proposed": data.get("escrow_proposed", False),
            "escrow_proposed_by": data.get("escrow_proposed_by"),
            "status": "draft",
        })
        .execute()
    )
    return response.data[0]


def get_contract(contract_id: str) -> dict | None:
    response = (
        supabase.table("contracts")
        .select("*")
        .eq("id", contract_id)
        .single()
        .execute()
    )
    return response.data


def get_contracts_by_owner(owner_id: str) -> list[dict]:
    response = (
        supabase.table("contracts")
        .select("*")
        .eq("owner_id", owner_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


def update_contract(contract_id: str, data: dict) -> dict:
    response = (
        supabase.table("contracts")
        .update(data)
        .eq("id", contract_id)
        .execute()
    )
    return response.data[0]


# ── Term extraction ───────────────────────────────────────────────────────────

async def extract_terms(request: ExtractTermsRequest) -> ExtractTermsResponse:
    edge_url = f"{settings.supabase_url}/functions/v1/extract-terms"

    payload = {
        "text": request.text,
        "image_url": request.image_url,
        "input_type": request.input_type,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            edge_url,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "application/json",
            },
        )

    if response.status_code != 200:
        raise Exception(f"extract-terms edge function error: {response.text}")

    result = response.json()
    terms = result["extracted_terms"]

    supabase.table("contracts").update({
        "extracted_terms": terms,
        "service_provider": terms.get("service_provider"),
        "client": terms.get("client"),
        "deliverables": terms.get("deliverables"),
        "payment": terms.get("payment"),
        "timeline": terms.get("timeline"),
        "default_clause": terms.get("default_clause"),
        "ambiguities": terms.get("ambiguities"),
    }).eq("id", request.contract_id).execute()

    supabase.table("contract_events").insert({
        "contract_id": request.contract_id,
        "actor_role": "system",
        "event_type": "terms_extracted",
        "metadata": {
            "input_type": request.input_type,
            "ambiguity_count": len(terms.get("ambiguities", [])),
        },
    }).execute()

    return ExtractTermsResponse(
        contract_id=request.contract_id,
        extracted_terms=ExtractedTerms(**terms),
    )


# ── Signing links ─────────────────────────────────────────────────────────────

async def send_signing_links(request: SendSigningLinksRequest) -> SendSigningLinksResponse:
    """
    1. Moves contract to pending_signatures
    2. Calls edge function to create signature rows and get signing URL
    3. Sends email to client via Gmail SMTP
    """
    # Move contract to pending_signatures
    supabase.table("contracts").update({
        "status": "pending_signatures",
    }).eq("id", request.contract_id).execute()

    # Call edge function — creates signature rows, returns signing URL
    edge_url = f"{settings.supabase_url}/functions/v1/send-signing-links"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            edge_url,
            json={"contract_id": request.contract_id},
            headers={
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "application/json",
            },
        )

    if response.status_code != 200:
        raise Exception(f"send-signing-links edge function error: {response.text}")

    result = response.json()

    client_info = result["client"]
    sp_info = result["service_provider"]
    contract_info = result["contract"]

    # Fetch full contract for edit_note fields
    contract = get_contract(request.contract_id)

    # Send email via Gmail SMTP
    html = build_signing_email(
        client_name=client_info["name"],
        sp_name=sp_info["name"],
        contract_title=contract_info["title"] or contract_info["reference"],
        signing_url=client_info["signing_url"],
        escrow_proposed=contract_info["escrow_proposed"],
        payment=contract_info["payment"],
        edit_note=contract.get("edit_note") if contract else None,
        notify_party_b=contract.get("notify_party_b", False) if contract else False,
    )

    send_email(
        to=client_info["email"],
        subject=f"{sp_info['name']} sent you a contract to review",
        html=html,
    )

    return SendSigningLinksResponse(
        success=True,
        client=ClientSigningInfo(
            email=client_info["email"],
            signing_url=client_info["signing_url"],
            token=client_info["token"],
        ),
        service_provider={"note": sp_info["note"]},
    )


# ── Milestones ────────────────────────────────────────────────────────────────

def create_milestone(data: dict) -> dict:
    response = (
        supabase.table("milestones")
        .insert(data)
        .execute()
    )
    return response.data[0]


def get_milestones(contract_id: str) -> list[dict]:
    response = (
        supabase.table("milestones")
        .select("*")
        .eq("contract_id", contract_id)
        .order("position")
        .execute()
    )
    return response.data


# ── Escrow conditions ─────────────────────────────────────────────────────────

def create_escrow_condition(data: dict) -> dict:
    response = (
        supabase.table("escrow_conditions")
        .insert(data)
        .execute()
    )
    return response.data[0]


def get_escrow_conditions(contract_id: str) -> list[dict]:
    response = (
        supabase.table("escrow_conditions")
        .select("*")
        .eq("contract_id", contract_id)
        .order("position")
        .execute()
    )
    return response.data