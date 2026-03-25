// sign-contract
// Called when a party submits their signature from the signing page.
// Handles the full mutual escrow consent model:
//   - service_provider signing: records signature only, escrow is not touched
//   - client signing: records signature + escrow_consent, then if accepted
//     AND service_provider has already signed, activates escrow via Interswitch Web Checkout
//
// Also checks if all parties have now signed and transitions contract to 'signed'.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Interswitch credentials
const INTERSWITCH_CLIENT_ID = Deno.env.get("INTERSWITCH_CLIENT_ID")!;
const INTERSWITCH_SECRET = Deno.env.get("INTERSWITCH_SECRET")!;
const INTERSWITCH_BASE_URL = Deno.env.get("INTERSWITCH_BASE_URL") ??
  "https://qa.interswitchng.com"; // swap to prod URL for go-live

const APP_URL = Deno.env.get("APP_URL")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Interswitch helpers ────────────────────────────────────────────────────────

async function getInterswitchToken(): Promise<string> {
  const credentials = btoa(`${INTERSWITCH_CLIENT_ID}:${INTERSWITCH_SECRET}`);
  const response = await fetch(
    `${INTERSWITCH_BASE_URL}/passport/oauth/token?grant_type=client_credentials`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Interswitch token error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Initiates a Web Checkout payment and returns the payment URL to redirect the client.
// Amount must be in kobo (NGN × 100).
async function initiateWebCheckout(params: {
  reference: string;
  amount_kobo: number;
  customer_email: string;
  customer_name: string;
  description: string;
}): Promise<{ payment_url: string; interswitch_ref: string }> {
  const token = await getInterswitchToken();

  // Interswitch merchant code and pay item ID come from your Quickteller Business dashboard
  const MERCHANT_CODE = Deno.env.get("INTERSWITCH_MERCHANT_CODE")!;
  const PAY_ITEM_ID = Deno.env.get("INTERSWITCH_PAY_ITEM_ID")!;

  // Build the Web Checkout URL — Interswitch uses query params for hosted checkout
  const checkoutParams = new URLSearchParams({
    merchantCode: MERCHANT_CODE,
    payItemID: PAY_ITEM_ID,
    customerEmail: params.customer_email,
    customerName: params.customer_name,
    transactionReference: params.reference,
    amount: String(params.amount_kobo),
    currency: "566", // ISO 4217 numeric code for NGN
    siteRedirectURL: `${APP_URL}/contracts/${params.reference}/escrow-confirm`,
    mode: "TEST", // Remove for production
  });

  const payment_url = `${INTERSWITCH_BASE_URL}/collections/w/pay?${checkoutParams.toString()}`;

  return {
    payment_url,
    interswitch_ref: params.reference,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const {
      signing_token,
      confirmed_name,
      signature_method, // 'draw' | 'type'
      signature_data,   // base64 PNG or typed name string
      escrow_consent,   // 'accepted' | 'declined' | undefined (service_provider)
      ip_address,
      user_agent,
    } = await req.json();

    if (!signing_token) {
      return Response.json({ error: "signing_token is required" }, { status: 400 });
    }

    // ── Fetch signature row ──────────────────────────────────────────────────
    const { data: sig, error: sigError } = await supabase
      .from("signatures")
      .select("*, contracts(*)")
      .eq("signing_token", signing_token)
      .single();

    if (sigError || !sig) {
      return Response.json({ error: "Invalid or expired signing link" }, { status: 404 });
    }

    if (sig.status === "signed") {
      return Response.json({ error: "This contract has already been signed" }, { status: 409 });
    }

    if (sig.status === "rejected") {
      return Response.json({ error: "This signing request was rejected" }, { status: 409 });
    }

    if (new Date(sig.token_expires_at) < new Date()) {
      return Response.json({ error: "This signing link has expired" }, { status: 410 });
    }

    const contract = sig.contracts;
    const now = new Date().toISOString();

    // ── Record the signature ─────────────────────────────────────────────────
    const signatureUpdate: Record<string, unknown> = {
      status: "signed",
      status_updated_at: now,
      signed_at: now,
      confirmed_name,
      signature_method,
      signature_data,
      ip_address,
      user_agent,
    };

    // Escrow consent is only recorded on the client's row
    if (sig.party_role === "client" && contract.escrow_proposed) {
      if (!escrow_consent || !["accepted", "declined"].includes(escrow_consent)) {
        return Response.json(
          { error: "escrow_consent ('accepted' or 'declined') is required for the client when escrow has been proposed" },
          { status: 400 }
        );
      }
      signatureUpdate.escrow_consent = escrow_consent;
      signatureUpdate.escrow_consented_at = now;
    }

    const { error: updateSigError } = await supabase
      .from("signatures")
      .update(signatureUpdate)
      .eq("id", sig.id);

    if (updateSigError) {
      console.error("Signature update error:", updateSigError);
      return Response.json({ error: "Failed to record signature" }, { status: 500 });
    }

    // Log the signing event
    await supabase.from("contract_events").insert({
      contract_id: contract.id,
      actor_role: sig.party_role,
      event_type: "party_signed",
      metadata: {
        party_role: sig.party_role,
        signature_method,
        escrow_consent: sig.party_role === "client" ? escrow_consent : null,
      },
    });

    // ── Check if all parties have now signed ─────────────────────────────────
    const { data: allSignatures } = await supabase
      .from("signatures")
      .select("party_role, status")
      .eq("contract_id", contract.id);

    const spSigned = allSignatures?.find((s) => s.party_role === "service_provider")?.status === "signed";
    const clientSigned = allSignatures?.find((s) => s.party_role === "client")?.status === "signed";
    const allSigned = spSigned && clientSigned;

    let escrowPaymentUrl: string | null = null;

    if (allSigned) {
      // Transition contract to 'signed'
      await supabase
        .from("contracts")
        .update({ status: "signed" })
        .eq("id", contract.id);

      await supabase.from("contract_events").insert({
        contract_id: contract.id,
        actor_role: "system",
        event_type: "all_signed",
        metadata: { signed_at: now },
      });

      // ── Escrow activation (mutual consent model) ──────────────────────────
      // Only activate if:
      //   1. escrow was proposed
      //   2. client explicitly accepted (not just signed — acceptance is separate)
      //
      // The service_provider proposing escrow = implicit consent on their part.
      // We check the client's signature row for their explicit response.

      const clientSig = allSignatures?.find((s) => s.party_role === "client");

      // Re-fetch client sig to get escrow_consent (the local allSignatures doesn't include it)
      const { data: clientSigFull } = await supabase
        .from("signatures")
        .select("escrow_consent")
        .eq("contract_id", contract.id)
        .eq("party_role", "client")
        .single();

      const clientAcceptedEscrow = clientSigFull?.escrow_consent === "accepted";

      if (contract.escrow_proposed && clientAcceptedEscrow) {
        try {
          // Amount in kobo: NGN amount × 100
          const amountKobo = Math.round((contract.payment?.amount ?? 0) * 100);

          const { payment_url, interswitch_ref } = await initiateWebCheckout({
            reference: contract.reference,
            amount_kobo: amountKobo,
            customer_email: contract.client?.contact,
            customer_name: contract.client?.name,
            description: `Escrow payment for ${contract.title ?? contract.reference}`,
          });

          // Store the payment URL — client will be redirected here to fund escrow
          await supabase
            .from("contracts")
            .update({
              escrow_active: false,         // Not active yet — active only after Interswitch confirms
              interswitch_ref,
              interswitch_status: "pending",
              interswitch_payment_url: payment_url,
            })
            .eq("id", contract.id);

          escrowPaymentUrl = payment_url;

          await supabase.from("contract_events").insert({
            contract_id: contract.id,
            actor_role: "system",
            event_type: "escrow_payment_initiated",
            metadata: { interswitch_ref, amount_kobo: amountKobo },
          });
        } catch (escrowErr) {
          // Escrow initiation failure should not block contract signing
          // Log it, store the error, and let the contract proceed
          console.error("Escrow initiation error:", escrowErr);
          await supabase
            .from("contracts")
            .update({ interswitch_error: String(escrowErr) })
            .eq("id", contract.id);
        }
      } else if (contract.escrow_proposed && !clientAcceptedEscrow) {
        // Client declined escrow — notify service_provider via event log
        // Frontend can watch for this event and show an in-app notification
        await supabase.from("contract_events").insert({
          contract_id: contract.id,
          actor_role: "system",
          event_type: "escrow_declined_by_client",
          metadata: { notified_at: now },
        });
      }
    }

    return Response.json(
      {
        success: true,
        party_role: sig.party_role,
        all_signed: allSigned,
        // If escrow was accepted and payment URL was generated, return it so
        // the frontend can redirect the client to Interswitch immediately
        escrow_payment_url: escrowPaymentUrl,
      },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    console.error("sign-contract error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});