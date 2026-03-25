// ── Shared ───────────────────────────────────────────────────────────────────

export interface Party {
  name: string;
  role?: string;
  contact?: string;
}

export interface DeliverableItem {
  items: string[];
  revision_limit?: number;
  exclusions?: string[];
}

export interface MilestoneSplit {
  label: string;
  amount: number;
  trigger: string;
}

export interface Payment {
  amount: number;
  currency: string;
  schedule?: "upfront" | "on_delivery" | "milestone" | "split";
  milestone_split?: MilestoneSplit[];
}

export interface Timeline {
  deadline?: string;
  milestones?: Record<string, unknown>[];
}

export interface DefaultClause {
  service_provider_default?: string;
  client_default?: string;
}

export interface Ambiguity {
  phrase: string;
  reason: string;
  clarification_question: string;
}

// ── Contracts ────────────────────────────────────────────────────────────────

export interface Contract {
  id: string;
  owner_id: string;
  title: string;
  raw_input?: string;
  input_type: "paste" | "screenshot" | "manual";
  screenshot_url?: string;
  escrow_proposed: boolean;
  escrow_proposed_by?: string;
  status: string;
  extracted_terms?: ExtractedTerms;
  service_provider?: Party;
  client?: Party;
  deliverables?: DeliverableItem;
  payment?: Payment;
  timeline?: Timeline;
  default_clause?: DefaultClause;
  ambiguities?: Ambiguity[];
  created_at: string;
  updated_at?: string;
}

export interface CreateContractPayload {
  title: string;
  raw_input?: string;
  input_type?: "paste" | "screenshot" | "manual";
  screenshot_url?: string;
  escrow_proposed?: boolean;
  escrow_proposed_by?: string;
}

// ── Extract Terms ────────────────────────────────────────────────────────────

export interface ExtractTermsPayload {
  contract_id: string;
  text?: string;
  image_url?: string;
  input_type: "paste" | "screenshot" | "manual";
}

export interface ExtractedTerms {
  service_provider: Party;
  client: Party;
  deliverables: DeliverableItem;
  payment: Payment;
  timeline: Timeline;
  default_clause?: DefaultClause;
  ambiguities: Ambiguity[];
}

export interface ExtractTermsResponse {
  contract_id: string;
  extracted_terms: ExtractedTerms;
}

// ── Signing ──────────────────────────────────────────────────────────────────

export interface SendSigningLinksPayload {
  contract_id: string;
}

export interface ClientSigningInfo {
  email: string;
  signing_url: string;
  token: string;
}

export interface SendSigningLinksResponse {
  success: boolean;
  client: ClientSigningInfo;
  service_provider: { note: string };
}

// ── Sign Contract (Supabase Edge Function — no auth required) ────────────────

export interface SignContractPayload {
  signing_token: string;
  confirmed_name: string;
  signature_method: "type" | "draw";
  signature_data: string;
  escrow_consent?: "accepted" | "declined";
}

export interface SignContractResponse {
  success: boolean;
  message?: string;
  escrow_payment_url?: string;
}

export interface SignatureWithContract {
  id: string;
  signing_token: string;
  role: string;
  status: string;
  contracts: Contract;
}

// ── Milestones ───────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  contract_id: string;
  label: string;
  amount?: number;
  trigger?: string;
  position: number;
  status?: string;
  created_at: string;
}

export interface CreateMilestonePayload {
  contract_id: string;
  label: string;
  amount?: number;
  trigger?: string;
  position: number;
}
