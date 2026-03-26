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
  reference?: string;
  title: string;
  raw_input?: string;
  input_type: "paste" | "screenshot" | "manual";
  screenshot_url?: string;
  escrow_proposed: boolean;
  escrow_proposed_by?: string;
  escrow_active?: boolean;
  interswitch_ref?: string;
  interswitch_status?: string;
  interswitch_payment_url?: string;
  interswitch_error?: string;
  disputed_by?: string;
  disputed_at?: string;
  dispute_reason?: string;
  status: string;
  contract_html?: string;
  contract_pdf_url?: string;
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
  image_urls?: string[];
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

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatPayload {
  contract_id: string;
  content?: string;
  image_url?: string;
  image_urls?: string[];
  input_type: "paste" | "screenshot" | "manual";
}

export interface ChatResponseMessage {
  role: "assistant";
  content: string;
  created_at: string;
}

export interface ChatResponse {
  messages: ChatResponseMessage[];
  ready: boolean;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  time: string;
  date: string;
  status: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  images: string[];
  metadata: Record<string, unknown>;
  created_at: string;
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
}

export interface DeclineSignaturePayload {
  reason: string;
  signing_token?: string;
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
  party_role?: string;
  all_signed?: boolean;
  escrow_payment_url?: string;
}

export interface Signature {
  id: string;
  contract_id: string;
  signer_name?: string;
  signer_email?: string;
  role: "service_provider" | "client";
  status: "pending" | "signed" | "rejected";
  signing_token?: string;
  signed_at?: string;
  rejected_at?: string;
  rejection_note?: string;
  created_at: string;
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

export interface MilestoneActionPayload {
  action: "submit" | "confirm" | "release";
  milestone_id: string;
  party_role: "service_provider" | "client";
  signing_token: string;
  condition_id?: string;
}

// ── PDF ──────────────────────────────────────────────────────────────────────

export interface ContractPdfResponse {
  contract_pdf_url: string;
}
