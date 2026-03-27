import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { createApiClient } from "~/config/axiosInstance";
import { handleError } from "~/utils/handleError";
import type {
  Contract,
  CreateContractPayload,
  ExtractTermsPayload,
  ExtractTermsResponse,
  ChatPayload,
  ChatResponse,
  ChatHistoryItem,
  ChatMessage,
  DeclineSignaturePayload,
  ContractPdfResponse,
  Milestone,
  CreateMilestonePayload,
} from "~/utils/types/api";

let client: ReturnType<typeof createApiClient> | null = null;

const getClient = () => {
  if (!client) client = createApiClient();
  return client;
};

/**
 * Generic request wrapper with typed responses and error handling.
 * Automatically includes `x-owner-id` header via the axios instance.
 */
const makeRequest = async <T = unknown>(
  url: string,
  method: "get" | "post" | "patch" | "delete",
  data?: unknown,
): Promise<T> => {
  try {
    const response = await getClient()({ method, url, data });
    return response.data as T;
  } catch (error: unknown) {
    handleError(error as Error);
    throw error;
  }
};

// ── Health ────────────────────────────────────────────────────────────────────

/** Checks if the FastAPI backend is reachable. */
export const useHealthQuery = () =>
  useQuery({
    queryKey: ["health"],
    queryFn: () => makeRequest("/health", "get"),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

// ── Chat ─────────────────────────────────────────────────────────────────────

/**
 * Sends a user message (text or image URL) to the AI chat.
 * Backend persists messages, calls Claude, and returns the assistant reply.
 * If `ready=true`, the backend has auto-extracted terms to the contract row.
 */
export const useSendChatMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChatPayload) =>
      makeRequest<ChatResponse>("/chat", "post", payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", variables.contract_id] });
      qc.invalidateQueries({ queryKey: ["chat-history"] });
      if (_data.ready) {
        qc.invalidateQueries({ queryKey: ["contract", variables.contract_id] });
      }
    },
  });
};

/** Lists past conversations for the logged-in user. Used by History.vue. */
export const useChatHistoryQuery = () =>
  useQuery<{ chats: ChatHistoryItem[] }>({
    queryKey: ["chat-history"],
    queryFn: () => makeRequest<{ chats: ChatHistoryItem[] }>("/chat/history", "get"),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });

/**
 * Loads full message history for a conversation.
 * @param chatId - Reactive chat/contract ID; query is disabled when null.
 */
export const useChatMessagesQuery = (chatId: MaybeRef<string | null>) =>
  useQuery<{ messages: ChatMessage[] }>({
    queryKey: computed(() => ["chat-messages", toValue(chatId)]),
    queryFn: () =>
      makeRequest<{ messages: ChatMessage[] }>(`/chat/${toValue(chatId)}/messages`, "get"),
    enabled: computed(() => !!toValue(chatId)),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

// ── Contracts ────────────────────────────────────────────────────────────────

/** Fetches all contracts for the authenticated user. */
export const useContractsQuery = () =>
  useQuery<Contract[]>({
    queryKey: ["contracts"],
    queryFn: () => makeRequest<Contract[]>("/contracts/", "get"),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 15,
  });

/**
 * Fetches a single contract by ID including extracted terms, status, and PDF URL.
 * @param contractId - Reactive contract ID; query is disabled when null.
 */
export const useContractQuery = (contractId: MaybeRef<string | null>) =>
  useQuery<Contract>({
    queryKey: computed(() => ["contract", toValue(contractId)]),
    queryFn: () =>
      makeRequest<Contract>(`/contracts/${toValue(contractId)}`, "get"),
    enabled: computed(() => !!toValue(contractId)),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 15,
  });

/** Creates a new draft contract. Invalidates the contracts list on success. */
export const useCreateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractPayload) =>
      makeRequest<Contract>("/contracts/", "post", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
};

/** Updates an existing contract. Invalidates both list and specific contract cache. */
export const useUpdateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contract> }) =>
      makeRequest<Contract>(`/contracts/${id}`, "patch", data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["contract", variables.id] });
    },
  });
};

// ── Extract Terms ────────────────────────────────────────────────────────────

/**
 * Manually trigger term extraction (also called automatically by chat when ready=true).
 * The backend proxies to the Supabase `extract-terms` Edge Function.
 */
export const useExtractTerms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExtractTermsPayload) =>
      makeRequest<ExtractTermsResponse>(
        "/contracts/extract-terms",
        "post",
        payload,
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["contract", variables.contract_id] });
    },
  });
};

// ── Decline Signature ────────────────────────────────────────────────────────

/**
 * Declines a signing request with a reason.
 * Works for both authenticated owners (x-owner-id) and token-based signers.
 */
export const useDeclineSignature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contractId,
      signatureId,
      payload,
    }: {
      contractId: string;
      signatureId: string;
      payload: DeclineSignaturePayload;
    }) =>
      makeRequest<{ success: boolean }>(
        `/contracts/${contractId}/signatures/${signatureId}/decline`,
        "post",
        payload,
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["contract", variables.contractId] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
};

// ── Contract PDF ─────────────────────────────────────────────────────────────

/**
 * Gets a presigned download URL for the signed contract PDF.
 * Also accepts a signing_token query param for unauthenticated access.
 * @param contractId - Reactive contract ID; query is disabled when null.
 * @param signingToken - Optional token for unauthenticated access.
 */
export const useContractPdfQuery = (
  contractId: MaybeRef<string | null>,
  signingToken?: MaybeRef<string | null>,
) =>
  useQuery<ContractPdfResponse>({
    queryKey: computed(() => ["contract-pdf", toValue(contractId)]),
    queryFn: () => {
      const token = toValue(signingToken);
      const qs = token ? `?signing_token=${token}` : "";
      return makeRequest<ContractPdfResponse>(
        `/contracts/${toValue(contractId)}/pdf${qs}`,
        "get",
      );
    },
    enabled: computed(() => !!toValue(contractId)),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

// ── Signing (via backend) ────────────────────────────────────────────────────

/**
 * Sends signing links through the backend, which moves the contract to
 * pending_signatures before calling the edge function.
 */
export const sendSigningLinksViaBackend = (contractId: string) =>
  makeRequest<{ message: string }>("/signing/send-links", "post", {
    contract_id: contractId,
  });

// ── Milestones ───────────────────────────────────────────────────────────────

/**
 * Fetches milestones for a contract.
 * @param contractId - Reactive contract ID; query is disabled when null.
 */
export const useMilestonesQuery = (contractId: MaybeRef<string | null>) =>
  useQuery<Milestone[]>({
    queryKey: computed(() => ["milestones", toValue(contractId)]),
    queryFn: () =>
      makeRequest<Milestone[]>(`/milestones/${toValue(contractId)}`, "get"),
    enabled: computed(() => !!toValue(contractId)),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 15,
  });

/** Creates a milestone for a contract. Invalidates the milestones cache on success. */
export const useCreateMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMilestonePayload) =>
      makeRequest<Milestone>("/milestones/", "post", payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["milestones", variables.contract_id] });
    },
  });
};
