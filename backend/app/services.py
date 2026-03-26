import httpx
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

from app.supabase_client import get_supabase
from app.config import get_settings
from app.schemas import (
    ExtractTermsRequest,
    ExtractTermsResponse,
    ExtractedTerms,
    SendSigningLinksRequest,
    SendSigningLinksResponse,
    ClientSigningInfo,
    # chat schemas
    ChatRequest,
    ChatResponse,
    MessageResponse,
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


# ── Chat flow ─────────────────────────────────────────────────────────────────

async def chat(request: ChatRequest) -> ChatResponse:
    """Conversational flow sitting on top of extract-terms.

    - Fetches message history for the contract
    - On first message, also includes the contract.raw_input or screenshot_url
    - Sends full convo to Claude with a conversational system prompt
    - Stores both the user message and Claude's reply in the messages table
    - If Claude signals it's ready, calls extract_terms to produce structured terms
    """
    contract_id = request.contract_id

    # Build incoming user content and images list
    user_text = request.content or ""
    images = []
    if request.image_url:
        images = [request.image_url]
        # provide a short content marker if no text
        if not user_text:
            user_text = "[screenshot]"

    # Fetch existing message history for this contract
    resp = (
        supabase.table("messages")
        .select("*")
        .eq("contract_id", contract_id)
        .order("created_at", desc=False)
        .execute()
    )

    history = resp.data or []

    # Build conversation array (only user/assistant roles included in messages)
    convo = []
    for m in history:
        role = m.get("role")
        content = m.get("content")
        # If stored images exist, expand content marker
        if m.get("images") and not content:
            content = "[screenshot]"
        if role in ("user", "assistant") and content:
            convo.append({"role": role, "content": content})

    # On first message, also read raw_input or screenshot from contract row
    if not history:
        # Only seed from the stored contract row when the incoming request
        # did NOT include its own content or image. This prevents sending
        # the same input twice on the very first user turn.
        if not request.content and not request.image_url:
            contract = get_contract(contract_id)
            if contract:
                if contract.get("raw_input"):
                    convo.append({"role": "user", "content": contract.get("raw_input")})
                elif contract.get("screenshot_url"):
                    convo.append({"role": "user", "content": f"[screenshot] {contract.get('screenshot_url')}"})

    # Append current user message
    convo.append({"role": "user", "content": user_text})

    # Build the user_assistant_messages per Anthropic expected shape
    user_assistant_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in convo
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]

    # System prompt: instruct Claude to be conversational and to signal readiness
    system_prompt = (
        "You are PactAI's conversational assistant. Your job is to help the user turn informal "
        "input (pasted text, chat screenshots, or manual typing) into a formal contract by: "
        "1) Summarising what you understand so far; 2) Asking a single clarifying question at a time "
        "whenever something is missing or ambiguous; and 3) When you have enough information to "
        "produce the final structured extraction, append the token <READY_TO_EXTRACT> at the end of your reply. "
        "Do not perform the final structured extraction yourself — simply indicate readiness with the token so the system can call the extract-terms function."
    )

    body = {
        "model": "claude-sonnet-4-6",
        "max_tokens": 1000,
        "system": system_prompt,
        "messages": user_assistant_messages,
    }

    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post("https://api.anthropic.com/v1/messages", json=body, headers=headers)

    if resp.status_code != 200:
        raise Exception(f"Anthropic API error: {resp.status_code} {resp.text}")

    result = resp.json()

    # Parse assistant text — per provided API structure
    ai_text = ""
    try:
        ai_text = result["content"][0]["text"]
    except Exception:
        # Fallback if structure differs
        ai_text = result.get("text") or ""

    # Detect readiness marker
    ready = False
    if "<READY_TO_EXTRACT>" in ai_text:
        ready = True
        ai_text = ai_text.replace("<READY_TO_EXTRACT>", "").strip()
    else:
        # Heuristic fallback: look for indicative phrases
        lowered = ai_text.lower()
        if any(k in lowered for k in ("ready to generate", "ready to extract", "i have enough", "i'm ready to generate", "i am ready to generate", "generate the contract", "ready to proceed")):
            ready = True

    now_iso = datetime.utcnow().isoformat()

    # Prepare rows to insert into messages table
    rows = []
    user_row = {
        "contract_id": contract_id,
        "role": "user",
        "content": user_text,
    }
    if images:
        user_row["images"] = images

    assistant_row = {
        "contract_id": contract_id,
        "role": "assistant",
        "content": ai_text,
        "metadata": {"ready": ready},
    }

    rows.append(user_row)
    rows.append(assistant_row)

    # Persist messages (let DB set created_at)
    try:
        supabase.table("messages").insert(rows).execute()
    except Exception as e:
        print("Failed to persist messages:", e)

    # If ready, trigger the extract_terms flow using contract's stored raw input / screenshot
    if ready:
        contract = get_contract(contract_id)
        if contract:
            ext_req = ExtractTermsRequest(
                contract_id=contract_id,
                text=contract.get("raw_input"),
                image_url=contract.get("screenshot_url"),
                input_type=contract.get("input_type", "paste"),
            )
            try:
                await extract_terms(ext_req)
            except Exception as e:
                print("extract_terms failed from chat flow:", e)

    # Return assistant message and ready flag
    msg = MessageResponse(role="assistant", content=ai_text, created_at=datetime.utcnow())

    return ChatResponse(messages=[msg], ready=ready)


# ── Chat helpers ──────────────────────────────────────────────────────────────

def get_messages(contract_id: str) -> list[dict]:
    """Return ordered messages for a contract. Maps 'assistant' role to 'ai' for frontend."""
    resp = (
        supabase.table("messages")
        .select("id, role, content, metadata, images, created_at")
        .eq("contract_id", contract_id)
        .order("created_at", desc=False)
        .execute()
    )
    rows = resp.data or []
    result = []
    for r in rows:
        role = r.get("role")
        frontend_role = "ai" if role == "assistant" else role
        result.append({
            "id": r.get("id"),
            "role": frontend_role,
            "text": r.get("content"),
            "images": r.get("images") or [],
            "metadata": r.get("metadata"),
            "created_at": r.get("created_at"),
        })
    return result


def get_chats(owner_id: str) -> list[dict]:
    """Return chat summaries for the owner by listing contracts and latest message."""
    # Fetch contracts for owner ordered by updated_at desc
    resp = (
        supabase.table("contracts")
        .select("id, title, status, raw_input, reference, updated_at")
        .eq("owner_id", owner_id)
        .order("updated_at", desc=True)
        .execute()
    )
    contracts = resp.data or []
    chats = []
    for c in contracts:
        cid = c.get("id")
        # Fetch latest message preview
        mresp = (
            supabase.table("messages")
            .select("content, images, created_at")
            .eq("contract_id", cid)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        m = (mresp.data or [None])[0]
        preview = None
        time = None
        date = None
        if m:
            preview = (m.get("content") or "")[:120]
            created = m.get("created_at")
            time = created
            date = created
            # If images exist and no text, set preview to indicate images
            if not preview and m.get("images"):
                preview = "[screenshot]"
        else:
            # fallback preview from contract raw_input
            raw = c.get("raw_input")
            preview = (raw or "")[:120] if raw else ""
            time = c.get("updated_at")
            date = c.get("updated_at")

        chats.append({
            "id": cid,
            "title": c.get("title") or c.get("reference"),
            "preview": preview,
            "time": time,
            "date": date,
            "status": c.get("status"),
        })
    return chats


def decline_signature(contract_id: str, signature_id: str, reason: str) -> dict:
    """Mark a signature row as rejected with a reason and create a contract_events entry."""
    # Validate signature exists and belongs to contract
    resp = supabase.table("signatures").select("id, contract_id, status").eq("id", signature_id).single().execute()
    sig = resp.data
    if not sig:
        raise Exception("Signature not found")
    if str(sig.get("contract_id")) != contract_id:
        raise Exception("Signature does not belong to contract")

    # Update signature row
    supabase.table("signatures").update({
        "status": "rejected",
        "rejection_note": reason,
        "rejected_at": datetime.utcnow().isoformat(),
        "status_updated_at": datetime.utcnow().isoformat(),
    }).eq("id", signature_id).execute()

    # Insert event
    supabase.table("contract_events").insert({
        "contract_id": contract_id,
        "actor_role": "client",
        "event_type": "signature_rejected",
        "metadata": {"signature_id": signature_id, "reason": reason},
    }).execute()

    return {"success": True}


def decline_signature_with_token(contract_id: str, signature_id: str, signing_token: str, reason: str) -> dict:
    """Allow a signer to decline using their signing_token (used by public signing link flows)."""
    # Fetch signature row by signing_token
    resp = supabase.table("signatures").select("id, contract_id, signing_token, status").eq("signing_token", signing_token).single().execute()
    sig = resp.data
    if not sig:
        raise Exception("Invalid signing token")
    if str(sig.get("id")) != signature_id:
        raise Exception("Signing token does not match signature id")
    if str(sig.get("contract_id")) != contract_id:
        raise Exception("Signature does not belong to contract")

    # Update signature to rejected
    supabase.table("signatures").update({
        "status": "rejected",
        "rejection_note": reason,
        "rejected_at": datetime.utcnow().isoformat(),
        "status_updated_at": datetime.utcnow().isoformat(),
    }).eq("id", signature_id).execute()

    # Insert event
    supabase.table("contract_events").insert({
        "contract_id": contract_id,
        "actor_role": "client",
        "event_type": "signature_rejected",
        "metadata": {"signature_id": signature_id, "reason": reason},
    }).execute()

    return {"success": True}


def get_contract_pdf(contract_id: str, expires: int = 300) -> dict:
    """Return a presigned URL for the contract PDF stored in the 'contracts' bucket.

    - expires: seconds until URL expires (default 5 minutes)
    - If the stored `contract_pdf_url` is already a full URL, return it as-is.
    - If it's a storage path, call Supabase Storage to create a signed URL.
    """
    resp = supabase.table("contracts").select("contract_pdf_url").eq("id", contract_id).single().execute()
    c = resp.data
    if not c or not c.get("contract_pdf_url"):
        raise Exception("No PDF available for this contract")

    stored = c.get("contract_pdf_url")

    # If stored looks like a full URL, return it directly
    if isinstance(stored, str) and (stored.startswith("http://") or stored.startswith("https://")):
        return {"contract_pdf_url": stored}

    # Otherwise treat it as a storage path and request a signed URL
    try:
        # supabase-py storage API: supabase.storage.from_(bucket).create_signed_url(path, expires_in)
        bucket = "contracts"
        result = supabase.storage.from_(bucket).create_signed_url(stored, expires)

        # result shape may vary between client versions. Try common keys.
        url = None
        if isinstance(result, dict):
            # supabase-py may return {'signed_url': '...'} or {'data': {'signedURL': '...'}}
            url = (
                result.get("signed_url")
                or result.get("signedURL")
                or result.get("signedUrl")
                or (result.get("data") or {}).get("signedURL")
                or (result.get("data") or {}).get("signed_url")
                or (result.get("data") or {}).get("signedUrl")
            )
        else:
            # Some clients return an object with attribute 'signed_url'
            url = getattr(result, "signed_url", None)
            if not url:
                url = getattr(result, "data", None) and getattr(result.data, "signedURL", None)

        if not url:
            # Fallback to constructing a public URL pattern — best-effort and may not work
            # Construct: <SUPABASE_URL>/storage/v1/object/public/<bucket>/<path>
            base = settings.supabase_url.rstrip("/")
            url = f"{base}/storage/v1/object/public/{bucket}/{stored}"

        return {"contract_pdf_url": url}
    except Exception as e:
        # If signing fails, fall back to stored value or raise depending on policy
        try:
            base = settings.supabase_url.rstrip("/")
            fallback = f"{base}/storage/v1/object/public/contracts/{stored}"
            return {"contract_pdf_url": fallback}
        except Exception:
            raise Exception("Failed to generate presigned URL and no fallback available: " + str(e))


def validate_signing_token_for_contract(signing_token: str, contract_id: str) -> bool:
    resp = supabase.table("signatures").select("id, signing_token, contract_id").eq("signing_token", signing_token).single().execute()
    sig = resp.data
    if not sig:
        return False
    return str(sig.get("contract_id")) == contract_id