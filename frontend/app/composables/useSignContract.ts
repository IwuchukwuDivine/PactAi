import log from "~/utils/log";
import type {
  Signature,
  SignContractPayload,
  SignContractResponse,
  SignatureWithContract,
  SendSigningLinksPayload,
  SendSigningLinksResponse,
  MilestoneActionPayload,
} from "~/utils/types/api";

/**
 * Composable for Supabase Edge Function calls related to signing and milestones.
 * These bypass FastAPI and hit Supabase directly (no x-owner-id, uses anon key).
 */
export default () => {
  const { supabase, initializeSupabase } = useSupabaseClient();
  const { addToast } = useToast();
  const config = useRuntimeConfig();

  const edgeFn = (name: string) =>
    `${config.public.supabaseUrl}/functions/v1/${name}`;

  const edgeHeaders = () => ({
    Authorization: `Bearer ${config.public.supabaseAnonKey}`,
    "Content-Type": "application/json",
  });

  const callEdgeFunction = async <T>(
    name: string,
    body: unknown,
  ): Promise<T | null> => {
    try {
      const response = await fetch(edgeFn(name), {
        method: "POST",
        headers: edgeHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as Record<string, string>).error || `Request failed (${response.status})`,
        );
      }

      return (await response.json()) as T;
    } catch (err) {
      log.error(`Edge function [${name}] failed:`, err);
      const message = err instanceof Error ? err.message : `Failed to call ${name}.`;
      addToast("error", message);
      return null;
    }
  };

  // ── Fetch signatures for a contract ────────────────────────────────────────

  const getSignaturesByContract = async (
    contractId: string,
  ): Promise<Signature[]> => {
    try {
      if (!supabase.value) await initializeSupabase();
      if (!supabase.value) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase.value
        .from("signatures")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as Signature[]) ?? [];
    } catch (err) {
      log.error("Failed to fetch signatures:", err);
      return [];
    }
  };

  // ── Fetch contract by signing token (direct Supabase query) ────────────────

  const getContractByToken = async (
    token: string,
  ): Promise<SignatureWithContract | null> => {
    try {
      if (!supabase.value) await initializeSupabase();
      if (!supabase.value) throw new Error("Supabase client not initialized");

      const { data, error } = await supabase.value
        .from("signatures")
        .select("*, contracts(*)")
        .eq("signing_token", token)
        .single();

      if (error) throw error;
      return data as SignatureWithContract;
    } catch (err) {
      log.error("Failed to fetch contract by token:", err);
      addToast("error", "Could not load contract. The link may be invalid or expired.");
      return null;
    }
  };

  // ── Send signing links ─────────────────────────────────────────────────────

  /** Creates signature rows and emails the client their signing link. */
  const sendSigningLinks = (payload: SendSigningLinksPayload) =>
    callEdgeFunction<SendSigningLinksResponse>("send-signing-links", payload);

  // ── Sign contract ──────────────────────────────────────────────────────────

  /** Submits a signature. Used by both the service provider (in-app) and client (via token). */
  const signContract = (payload: SignContractPayload) =>
    callEdgeFunction<SignContractResponse>("sign-contract", payload);

  // ── Milestone action ───────────────────────────────────────────────────────

  /** Submits, confirms, or releases a milestone. Handles escrow release/payout. */
  const milestoneAction = (payload: MilestoneActionPayload) =>
    callEdgeFunction<{ success: boolean }>("milestone-action", payload);

  return {
    getSignaturesByContract,
    getContractByToken,
    sendSigningLinks,
    signContract,
    milestoneAction,
  };
};
