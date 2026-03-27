// send-signing-links
// Called after a contract moves to pending_signatures.
//
// Who gets what:
//   - service_provider: already in the app and authenticated. Their signature row is
//     created here but NO email is sent — they sign directly from their dashboard.
//   - client: outside party, may not have an account. Gets an email with a tokenised
//     signing link. No account required to sign.
//
// Escrow: if escrow_proposed=true, the client's email includes a plain-language
// explanation of what escrow means before they open the signing page.

// send-signing-links
// Creates signature rows for both parties and returns the client signing URL.
// Email is handled by the FastAPI backend using Gmail SMTP — not here.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contract_id } = await req.json();

    if (!contract_id) {
      return Response.json(
        { error: "contract_id is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Fetch contract ────────────────────────────────────────────────────────
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      return Response.json(
        { error: "Contract not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (contract.status !== "pending_signatures") {
      return Response.json(
        { error: `Contract must be in pending_signatures state (current: ${contract.status})` },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Resolve party details ─────────────────────────────────────────────────
    const spName = contract.service_provider?.name ?? "Service Provider";
    const clientName = contract.client?.name ?? "Client";
    const clientEmail = contract.client?.contact ?? null;

    if (!clientEmail) {
      return Response.json(
        { error: "Client must have a contact email before signing links can be sent" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ── Upsert signature rows ─────────────────────────────────────────────────
    // service_provider: row created, no email sent — they sign in-app
    const { error: spErr } = await supabase
      .from("signatures")
      .upsert(
        {
          contract_id,
          party_role: "service_provider",
          signer_name: spName,
          status: "pending",
        },
        { onConflict: "contract_id,party_role", ignoreDuplicates: false }
      );

    if (spErr) {
      console.error("service_provider signature upsert error:", spErr);
      return Response.json(
        { error: "Failed to create service_provider signature row" },
        { status: 500, headers: corsHeaders }
      );
    }

    // client: row created, signing URL returned to FastAPI for emailing
    const { data: clientSig, error: clientErr } = await supabase
      .from("signatures")
      .upsert(
        {
          contract_id,
          party_role: "client",
          signer_name: clientName,
          signer_email: clientEmail,
          status: "pending",
        },
        { onConflict: "contract_id,party_role", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (clientErr || !clientSig) {
      console.error("client signature upsert error:", clientErr);
      return Response.json(
        { error: "Failed to create client signature row" },
        { status: 500, headers: corsHeaders }
      );
    }

    const clientSigningUrl = `${APP_URL}/sign/${clientSig.signing_token}`;

    // ── Log event ─────────────────────────────────────────────────────────────
    await supabase.from("contract_events").insert({
      contract_id,
      actor_role: "system",
      event_type: "signing_link_sent",
      metadata: { client_email: clientEmail },
    });

    return Response.json(
      {
        success: true,
        client: {
          email: clientEmail,
          name: clientName,
          signing_url: clientSigningUrl,
          token: clientSig.signing_token,
        },
        service_provider: {
          name: spName,
          note: "Signs in-app via authenticated session. No email sent.",
        },
        contract: {
          title: contract.title,
          reference: contract.reference,
          escrow_proposed: contract.escrow_proposed,
          payment: contract.payment,
        },
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("send-signing-links error:", err);
    return Response.json(
      { error: String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
});