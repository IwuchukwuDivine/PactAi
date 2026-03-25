import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { createApiClient } from "~/config/axiosInstance";
import { handleError } from "~/utils/handleError";
import type {
  Contract,
  CreateContractPayload,
  ExtractTermsPayload,
  ExtractTermsResponse,
  SendSigningLinksPayload,
  SendSigningLinksResponse,
  Milestone,
  CreateMilestonePayload,
} from "~/utils/types/api";

const client = createApiClient();

/**
 * Generic request wrapper with typed responses and error handling.
 * Automatically includes `x-owner-id` header via the axios instance.
 *
 * @param url - API endpoint path (e.g. "/contracts/")
 * @param method - HTTP method
 * @param data - Optional request body for POST/PATCH
 * @returns Typed response data from the API
 * @throws Re-throws after displaying error toast via `handleError`
 */
const makeRequest = async <T = unknown>(
  url: string,
  method: "get" | "post" | "patch" | "delete",
  data?: unknown,
): Promise<T> => {
  try {
    const response = await client({ method, url, data });
    return response.data as T;
  } catch (error: unknown) {
    handleError(error as Error);
    throw error;
  }
};

// ── Health ────────────────────────────────────────────────────────────────────

/** Checks if the FastAPI backend is reachable. Stale for 5 minutes. */
export const useHealthQuery = () =>
  useQuery({
    queryKey: ["health"],
    queryFn: () => makeRequest("/health", "get"),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

// ── Contracts ────────────────────────────────────────────────────────────────

/** Fetches all contracts for the authenticated user. Used on Home, Contracts, and Profile pages. */
export const useContractsQuery = () =>
  useQuery<Contract[]>({
    queryKey: ["contracts"],
    queryFn: () => makeRequest<Contract[]>("/contracts/", "get"),
    staleTime: 1000 * 60 * 2,
  });

/**
 * Fetches a single contract by ID. Used on contracts/[id] status page.
 * @param contractId - Reactive contract ID; query is disabled when null.
 */
export const useContractQuery = (contractId: MaybeRef<string | null>) =>
  useQuery<Contract>({
    queryKey: computed(() => ["contract", toValue(contractId)]),
    queryFn: () =>
      makeRequest<Contract>(`/contracts/${toValue(contractId)}`, "get"),
    enabled: computed(() => !!toValue(contractId)),
    staleTime: 1000 * 60,
  });

/**
 * Creates a new draft contract. Called after Chat AI generates terms.
 * Invalidates the contracts list on success.
 */
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

/**
 * Updates an existing contract (e.g. status, terms, escrow fields).
 * Invalidates both the contracts list and the specific contract cache.
 */
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
 * Sends raw text or an image URL to the AI for term extraction.
 * Called from Chat.vue when the user provides contract details.
 * The backend proxies to the Supabase `extract-terms` Edge Function.
 * Invalidates the contract cache on success (terms are written to the DB).
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

// ── Signing ──────────────────────────────────────────────────────────────────

/**
 * Sends signing invitation emails to the other party.
 * The backend creates signature rows and emails the client a signing link.
 * Invalidates contracts cache since status moves to `pending_signatures`.
 */
export const useSendSigningLinks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendSigningLinksPayload) =>
      makeRequest<SendSigningLinksResponse>(
        "/signing/send-links",
        "post",
        payload,
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["contract", variables.contract_id] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
};

// ── Milestones ───────────────────────────────────────────────────────────────

/**
 * Fetches milestones for a contract. Used on the contracts/[id] status page.
 * @param contractId - Reactive contract ID; query is disabled when null.
 */
export const useMilestonesQuery = (contractId: MaybeRef<string | null>) =>
  useQuery<Milestone[]>({
    queryKey: computed(() => ["milestones", toValue(contractId)]),
    queryFn: () =>
      makeRequest<Milestone[]>(`/milestones/${toValue(contractId)}`, "get"),
    enabled: computed(() => !!toValue(contractId)),
    staleTime: 1000 * 60,
  });

/**
 * Creates a milestone for a contract. Invalidates the milestones cache on success.
 */
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
