import log from "~/utils/log";
import type {
  SignContractPayload,
  SignContractResponse,
  SignatureWithContract,
} from "~/utils/types/api";

export default () => {
  const { supabase, initializeSupabase } = useSupabaseClient();
  const { addToast } = useToast();
  const config = useRuntimeConfig();

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

  const signContract = async (
    payload: SignContractPayload,
  ): Promise<SignContractResponse | null> => {
    try {
      const url = `${config.public.supabaseUrl}/functions/v1/sign-contract`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.public.supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as Record<string, string>).error || `Request failed (${response.status})`,
        );
      }

      return (await response.json()) as SignContractResponse;
    } catch (err) {
      log.error("Failed to sign contract:", err);
      const message = err instanceof Error ? err.message : "Failed to sign contract.";
      addToast("error", message);
      return null;
    }
  };

  return {
    getContractByToken,
    signContract,
  };
};
