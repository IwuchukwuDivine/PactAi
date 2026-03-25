// milestone-action
// Handles three actions on milestones:
//   - 'submit'  → service_provider marks milestone as complete (status: pending → submitted)
//   - 'confirm' → service_provider or client confirms an escrow_condition checkbox
//   - 'release' → client approves the milestone; checks ALL escrow_conditions are
//                 confirmed by BOTH parties before calling Interswitch Single Transfer
//
// The mutual confirmation gate is the critical escrow safety check:
// One-sided confirmation never triggers a release.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const INTERSWITCH_CLIENT_ID = Deno.env.get("INTERSWITCH_CLIENT_ID")!;
const INTERSWITCH_SECRET = Deno.env.get("INTERSWITCH_SECRET")!;
const INTERSWITCH_BASE_URL = Deno.env.get("INTERSWITCH_BASE_URL") ??
  "https://qa.interswitchng.com";

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

// Requery a transaction to verify it actually succeeded before releasing funds.
// Never trust redirect params alone — always verify server-side.
async function requeryTransaction(
  transactionRef: string
): Promise<{ success: boolean; status: string; raw: unknown }> {
  const token = await getInterswitchToken();
  const MERCHANT_CODE = Deno.env.get("INTERSWITCH_MERCHANT_CODE")!;

  const response = await fetch(
    `${INTERSWITCH_BASE_URL}/collections/api/v1/gettransaction.json?merchantcode=${MERCHANT_CODE}&transactionreference=${transactionRef}&amount=0`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Requery failed: ${await response.text()}`);
  }

  const data = await response.json();

  // Interswitch responseCode '00' = successful transaction
  return {
    success: data.ResponseCode === "00",
    status: data.ResponseCode,
    raw: data,
  };
}

// Single Transfer — push funds to the service provider's bank account.
// Requires their bank account number and bank code captured at signing.
async function singleTransfer(params: {
  reference: string;
  amount_kobo: number;
  beneficiary_account: string;
  beneficiary_bank_code: string;
  beneficiary_name: string;
  narration: string;
}): Promise<{ success: boolean; transfer_ref: string; raw: unknown }> {
  const token = await getInterswitchToken();

  const response = await fetch(
    `${INTERSWITCH_BASE_URL}/api/v2/purchases`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mac: "",                                    // HMAC — generate per Interswitch spec in production
        beneficiaryAccountName: params.beneficiary_name,
        beneficiaryAccountNumber: params.beneficiary_account,
        beneficiaryBankCode: params.beneficiary_bank_code,
        beneficiaryCurrencyCode: "566",             // NGN
        initiatingEntityCode: Deno.env.get("INTERSWITCH_ENTITY_CODE"),
        initiatorsTransactionReference: params.reference,
        initiatorsTransactionTimestamp: new Date().toISOString(),
        narration: params.narration,
        senderName: "PactAI Escrow",
        transactionAmount: String(params.amount_kobo),
      }),
    }
  );

  const data = await response.json();
  const success = data.responseCode === "00";

  return {
    success,
    transfer_ref: data.transferCode ?? params.reference,
    raw: data,
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
      action,          // 'submit' | 'confirm' | 'release'
      milestone_id,
      condition_id,    // required for action='confirm'
      party_role,      // 'service_provider' | 'client' — who is taking the action
      signing_token,   // used to authenticate the party (they may not have an account)
    } = await req.json();

    if (!action || !milestone_id || !party_role) {
      return Response.json(
        { error: "action, milestone_id, and party_role are required" },
        { status: 400 }
      );
    }

    // Verify party identity via signing_token
    const { data: sig } = await supabase
      .from("signatures")
      .select("party_role, contract_id, status")
      .eq("signing_token", signing_token)
      .single();

    if (!sig || sig.party_role !== party_role || sig.status !== "signed") {
      return Response.json({ error: "Unauthorized or token mismatch" }, { status: 403 });
    }

    // Fetch the milestone
    const { data: milestone, error: msError } = await supabase
      .from("milestones")
      .select("*, contracts(*)")
      .eq("id", milestone_id)
      .single();

    if (msError || !milestone) {
      return Response.json({ error: "Milestone not found" }, { status: 404 });
    }

    const contract = milestone.contracts;
    const now = new Date().toISOString();

    // ── ACTION: submit ────────────────────────────────────────────────────────
    // Service provider marks milestone as complete.
    // Only service_provider can submit.
    if (action === "submit") {
      if (party_role !== "service_provider") {
        return Response.json({ error: "Only the service provider can submit a milestone" }, { status: 403 });
      }
      if (milestone.status !== "pending") {
        return Response.json(
          { error: `Milestone cannot be submitted from status: ${milestone.status}` },
          { status: 400 }
        );
      }

      await supabase
        .from("milestones")
        .update({ status: "submitted", submitted_at: now })
        .eq("id", milestone_id);

      await supabase.from("contract_events").insert({
        contract_id: contract.id,
        actor_role: party_role,
        event_type: "milestone_submitted",
        metadata: { milestone_id, title: milestone.title },
      });

      return Response.json({ success: true, action: "submitted" });
    }

    // ── ACTION: confirm ───────────────────────────────────────────────────────
    // Either party checks off an escrow_condition.
    // Both must confirm before the release gate will pass.
    if (action === "confirm") {
      if (!condition_id) {
        return Response.json({ error: "condition_id is required for confirm action" }, { status: 400 });
      }

      const confirmField =
        party_role === "service_provider"
          ? "service_provider_confirmed"
          : "client_confirmed";

      const confirmedAtField =
        party_role === "service_provider"
          ? "service_provider_confirmed_at"
          : "client_confirmed_at";

      await supabase
        .from("escrow_conditions")
        .update({ [confirmField]: true, [confirmedAtField]: now })
        .eq("id", condition_id)
        .eq("contract_id", contract.id);

      await supabase.from("contract_events").insert({
        contract_id: contract.id,
        actor_role: party_role,
        event_type: "escrow_condition_confirmed",
        metadata: { condition_id, milestone_id },
      });

      return Response.json({ success: true, action: "confirmed", condition_id });
    }

    // ── ACTION: release ───────────────────────────────────────────────────────
    // Client approves the milestone and triggers escrow release.
    // Gate: ALL escrow_conditions linked to this milestone must be confirmed
    //       by BOTH service_provider AND client.
    if (action === "release") {
      if (party_role !== "client") {
        return Response.json({ error: "Only the client can trigger escrow release" }, { status: 403 });
      }

      if (!["submitted", "approved"].includes(milestone.status)) {
        return Response.json(
          { error: `Milestone must be in 'submitted' state to release. Current: ${milestone.status}` },
          { status: 400 }
        );
      }

      if (!contract.escrow_active) {
        return Response.json({ error: "Escrow is not active on this contract" }, { status: 400 });
      }

      // ── Dual confirmation gate ────────────────────────────────────────────
      // Fetch all escrow conditions for this milestone
      const { data: conditions } = await supabase
        .from("escrow_conditions")
        .select("*")
        .eq("milestone_id", milestone_id);

      if (conditions && conditions.length > 0) {
        const unconfirmed = conditions.filter(
          (c) => !c.service_provider_confirmed || !c.client_confirmed
        );

        if (unconfirmed.length > 0) {
          return Response.json(
            {
              error: "Not all escrow conditions have been confirmed by both parties",
              unconfirmed_count: unconfirmed.length,
              unconfirmed_labels: unconfirmed.map((c) => c.label),
            },
            { status: 400 }
          );
        }
      }

      // ── Requery to verify funds are actually held ─────────────────────────
      // Never trust local state alone — verify with Interswitch before releasing
      let requeryResult;
      try {
        requeryResult = await requeryTransaction(contract.interswitch_ref);
      } catch (rqErr) {
        console.error("Requery error:", rqErr);
        return Response.json(
          { error: "Could not verify payment status with Interswitch. Please try again." },
          { status: 502 }
        );
      }

      if (!requeryResult.success) {
        // Payment is not confirmed held — update status and block release
        await supabase
          .from("contracts")
          .update({ interswitch_status: "failed" })
          .eq("id", contract.id);

        return Response.json(
          {
            error: "Payment has not been confirmed by Interswitch. Release blocked.",
            interswitch_status: requeryResult.status,
          },
          { status: 402 }
        );
      }

      // Payment is confirmed held — update Supabase to reflect this
      await supabase
        .from("contracts")
        .update({ interswitch_status: "held", escrow_active: true })
        .eq("id", contract.id);

      // ── Single Transfer payout ────────────────────────────────────────────
      // Push funds to service provider's bank account.
      // Bank account details should be stored on the service_provider JSONB:
      // {name, role, contact, bank_account_number, bank_code}
      const spBankAccount = contract.service_provider?.bank_account_number;
      const spBankCode = contract.service_provider?.bank_code;
      const spName = contract.service_provider?.name ?? "Service Provider";

      if (!spBankAccount || !spBankCode) {
        return Response.json(
          {
            error:
              "Service provider bank account details are missing. " +
              "Add bank_account_number and bank_code to the service_provider field before releasing.",
          },
          { status: 400 }
        );
      }

      const amountKobo = Math.round((milestone.amount ?? 0) * 100);
      const transferRef = `${contract.reference}-MS-${milestone_id.slice(0, 8)}`;

      let transferResult;
      try {
        transferResult = await singleTransfer({
          reference: transferRef,
          amount_kobo: amountKobo,
          beneficiary_account: spBankAccount,
          beneficiary_bank_code: spBankCode,
          beneficiary_name: spName,
          narration: `PactAI escrow release: ${contract.title ?? contract.reference} — ${milestone.title}`,
        });
      } catch (transferErr) {
        console.error("Single Transfer error:", transferErr);
        await supabase
          .from("milestones")
          .update({ payment_error: String(transferErr) })
          .eq("id", milestone_id);

        return Response.json(
          { error: "Payment transfer failed. Funds are still held safely. Please retry." },
          { status: 502 }
        );
      }

      if (!transferResult.success) {
        const errMsg = JSON.stringify(transferResult.raw);
        await supabase
          .from("milestones")
          .update({ status: "failed", payment_error: errMsg })
          .eq("id", milestone_id);

        return Response.json(
          { error: "Interswitch transfer rejected. Funds are still held.", detail: errMsg },
          { status: 502 }
        );
      }

      // ── Mark milestone released ───────────────────────────────────────────
      await supabase
        .from("milestones")
        .update({
          status: "released",
          approved_at: now,
          payment_released_at: now,
          interswitch_ref: transferResult.transfer_ref,
        })
        .eq("id", milestone_id);

      // Update contract escrow status to released
      await supabase
        .from("contracts")
        .update({ interswitch_status: "released" })
        .eq("id", contract.id);

      await supabase.from("contract_events").insert({
        contract_id: contract.id,
        actor_role: party_role,
        event_type: "payment_released",
        metadata: {
          milestone_id,
          milestone_title: milestone.title,
          amount_kobo: amountKobo,
          transfer_ref: transferResult.transfer_ref,
        },
      });

      // Check if all milestones on the contract are now released → complete the contract
      const { data: allMilestones } = await supabase
        .from("milestones")
        .select("status")
        .eq("contract_id", contract.id);

      const allReleased = allMilestones?.every((m) => m.status === "released");
      if (allReleased) {
        await supabase
          .from("contracts")
          .update({ status: "completed" })
          .eq("id", contract.id);

        await supabase.from("contract_events").insert({
          contract_id: contract.id,
          actor_role: "system",
          event_type: "contract_completed",
          metadata: { completed_at: now },
        });
      }

      return Response.json({
        success: true,
        action: "released",
        transfer_ref: transferResult.transfer_ref,
        contract_completed: allReleased,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error("milestone-action error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});