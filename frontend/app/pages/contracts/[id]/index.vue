<template>
  <div class="status-page">
    <!-- Header -->
    <AppHeader
      style="padding-right: 20px; padding-left: 20px"
      title="Contract Status"
      show-back
    >
      <template #action>
        <button aria-label="More options" @click="showActions = true">
          <LucideEllipsisVertical :size="20" />
        </button>
      </template>
    </AppHeader>

    <!-- Loading state -->
    <SkeletonContractStatus v-if="isLoading || !contract" />

    <template v-else>
      <!-- Contract summary card -->
      <section class="status-card">
        <div class="status-card__top">
          <div
            class="status-card__icon"
            :class="`status-card__icon--${overallStatus}`"
          >
            <component :is="overallIcon" :size="24" />
          </div>
          <div class="status-card__meta">
            <h2 class="status-card__title">{{ contract.title }}</h2>
            <p class="status-card__date">
              <span v-if="contract.reference" class="status-card__ref">{{
                contract.reference
              }}</span>
              Created {{ contract.createdAt }}
            </p>
          </div>
        </div>

        <div class="status-card__parties">
          <div class="status-card__party">
            <span class="status-card__party-label">From</span>
            <span class="status-card__party-name">{{ contract.sender }}</span>
          </div>
          <LucideArrowRight :size="14" class="status-card__arrow" />
          <div class="status-card__party">
            <span class="status-card__party-label">To</span>
            <span class="status-card__party-name">{{
              contract.recipient
            }}</span>
          </div>
        </div>

        <!-- Overall status badge -->
        <div
          class="status-card__badge"
          :class="`status-card__badge--${overallStatus}`"
        >
          <component :is="overallIcon" :size="14" />
          <span>{{ overallLabel }}</span>
        </div>
      </section>

      <!-- Progress bar -->
      <section class="status-progress">
        <div class="status-progress__bar">
          <div
            class="status-progress__fill"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
        <span class="status-progress__label"
          >{{ completedSteps }} of {{ steps.length }} steps complete</span
        >
      </section>

      <!-- Timeline -->
      <section class="status-timeline">
        <div
          v-for="(step, i) in steps"
          :key="step.id"
          class="timeline-step"
          :class="{
            'timeline-step--done': step.status === 'done',
            'timeline-step--active': step.status === 'active',
            'timeline-step--pending': step.status === 'pending',
          }"
        >
          <!-- Connector line (not on first) -->
          <div
            v-if="i > 0"
            class="timeline-step__line"
            :class="{ 'timeline-step__line--done': step.status === 'done' }"
          />

          <div class="timeline-step__dot">
            <LucideCheck v-if="step.status === 'done'" :size="14" />
            <div
              v-else-if="step.status === 'active'"
              class="timeline-step__pulse"
            />
            <span v-else class="timeline-step__number">{{ i + 1 }}</span>
          </div>

          <div class="timeline-step__content">
            <div class="timeline-step__header">
              <h3 class="timeline-step__title">{{ step.title }}</h3>
              <span v-if="step.timestamp" class="timeline-step__time">{{
                step.timestamp
              }}</span>
            </div>
            <p class="timeline-step__desc">{{ step.description }}</p>

            <!-- Action button for active step -->
            <AppButton
              v-if="step.status === 'active' && step.action"
              :title="step.action.label"
              :variant="step.action.variant || 'primary'"
              :prepend-icon="step.action.icon"
              class="timeline-step__action"
              @click="step.action.handler()"
            />

            <!-- Signer chips for signature step -->
            <div v-if="step.signers" class="timeline-step__signers">
              <div
                v-for="signer in step.signers"
                :key="signer.name"
                class="timeline-signer"
                :class="`timeline-signer--${signer.status}`"
              >
                <div class="timeline-signer__avatar">
                  {{ signer.name.charAt(0) }}
                </div>
                <div class="timeline-signer__info">
                  <span class="timeline-signer__name">{{ signer.name }}</span>
                  <span class="timeline-signer__status">
                    <LucideCircleCheck
                      v-if="signer.status === 'signed'"
                      :size="12"
                    />
                    <LucideClock v-else :size="12" />
                    {{ signer.status === "signed" ? "Signed" : "Pending" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Escrow tracker (only when escrow exists) -->
      <section v-if="contract.escrow" class="status-escrow">
        <div class="status-escrow__header">
          <div class="status-escrow__icon">
            <LucideLock :size="18" />
          </div>
          <div>
            <h3 class="status-escrow__title">Escrow</h3>
            <p class="status-escrow__subtitle">
              {{ contract.escrow.condition }}
            </p>
          </div>
          <div
            class="status-escrow__badge"
            :class="`status-escrow__badge--${contract.escrow.status}`"
          >
            {{ escrowStatusLabel }}
          </div>
        </div>

        <div class="status-escrow__amount-row">
          <span class="status-escrow__amount-label">Amount held</span>
          <span class="status-escrow__amount">{{
            contract.escrow.amount
          }}</span>
        </div>

        <!-- Escrow mini-timeline -->
        <div class="status-escrow__steps">
          <div
            v-for="(es, i) in escrowSteps"
            :key="es.label"
            class="escrow-step"
            :class="{
              'escrow-step--done': es.done,
              'escrow-step--active': es.active,
            }"
          >
            <div class="escrow-step__dot">
              <LucideCheck v-if="es.done" :size="10" />
            </div>
            <span class="escrow-step__label">{{ es.label }}</span>
            <div
              v-if="i < escrowSteps.length - 1"
              class="escrow-step__connector"
              :class="{ 'escrow-step__connector--done': es.done }"
            />
          </div>
        </div>
      </section>

      <!-- Quick actions -->
      <section class="status-actions">
        <button class="status-action" :disabled="isDraft" @click="handleViewContract">
          <LucideFileText :size="18" />
          <span>View contract</span>
        </button>
        <button class="status-action" :disabled="isDraft" @click="handleDownload">
          <LucideDownload :size="18" />
          <span>Download PDF</span>
        </button>
      </section>
    </template>

    <!-- Actions bottom slider -->
    <BottomSlider v-model="showActions" title="Actions">
      <div class="actions-menu">
        <button class="actions-menu__item" :disabled="isDraft" @click="handleResend">
          <LucideSend :size="18" />
          <span>Resend invite</span>
        </button>
        <button class="actions-menu__item" :disabled="isDraft" @click="handleViewContract">
          <LucideFileText :size="18" />
          <span>View full contract</span>
        </button>
        <button class="actions-menu__item" :disabled="isDraft" @click="handleDownload">
          <LucideDownload :size="18" />
          <span>Download PDF</span>
        </button>
        <button
          class="actions-menu__item actions-menu__item--danger"
          @click="handleCancel"
        >
          <LucideCircleX :size="18" />
          <span>Cancel contract</span>
        </button>
      </div>
    </BottomSlider>

    <!-- Client email prompt -->
    <Teleport to="body">
      <div v-if="showEmailPrompt" class="email-overlay" @click.self="showEmailPrompt = false">
        <div class="email-modal">
          <h3 class="email-modal__title">Client email required</h3>
          <p class="email-modal__desc">
            Enter the other party's email address so we can send them the
            contract for signing.
          </p>
          <input
            v-model="clientEmailInput"
            type="email"
            class="email-modal__input"
            placeholder="e.g. client@example.com"
            @keyup.enter="handleEmailSubmit"
          />
          <div class="email-modal__actions">
            <button class="email-modal__btn email-modal__btn--cancel" @click="showEmailPrompt = false">
              Cancel
            </button>
            <button
              class="email-modal__btn email-modal__btn--send"
              :disabled="sendingInvite"
              @click="handleEmailSubmit"
            >
              {{ sendingInvite ? "Sending…" : "Save & send invite" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import type { Signature, Contract } from "~/utils/types/api";
import {
  LucideFileText,
  LucideDownload,
  LucideSend,
  LucideCircleX,
  LucideCircleCheck,
  LucideClock,
  LucideLoader,
  LucideFileCheck,
  LucideWallet,
} from "lucide-vue-next";

const route = useRoute();
const { addToast } = useToast();
const showActions = ref(false);

useSeoMeta({
  title: "Contract Status",
  description:
    "Track the progress of your Pact AI contract — signatures, escrow funding, and completion status.",
});

// ── API data ───────────────────────────────────────────────────────────────

const contractId = computed(() => route.params.id as string);
const { data: contractData, isLoading } = useContractQuery(contractId);
const { getSignaturesByContract } = useSignContract();
const { mutateAsync: updateContract } = useUpdateContract();
const { data: _milestones } = useMilestonesQuery(contractId);


const signatures = ref<Signature[]>([]);

watch(
  contractData,
  async (c) => {
    if (c) signatures.value = await getSignaturesByContract(c.id);
  },
  { immediate: true },
);

// ── Helpers ────────────────────────────────────────────────────────────────

const isPlaceholder = (v?: string) =>
  !v || /^\s*<?\s*unknown\s*>?\s*$/i.test(v);

const formatTimestamp = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// ── Derived contract fields ────────────────────────────────────────────────

const contract = computed(() => {
  const c = contractData.value;
  if (!c) return null;

  const spName = isPlaceholder(c.service_provider?.name)
    ? undefined
    : c.service_provider!.name;
  const clientName = isPlaceholder(c.client?.name) ? undefined : c.client!.name;

  const hasEscrow = c.escrow_proposed || c.escrow_active;
  const escrowFunded = c.escrow_active || c.interswitch_status === "completed";
  const escrowDisputed = !!c.disputed_by;

  let escrowStatus: "unfunded" | "funded" | "released" | "disputed" =
    "unfunded";
  if (escrowDisputed) escrowStatus = "disputed";
  else if (c.status === "completed" && hasEscrow) escrowStatus = "released";
  else if (escrowFunded) escrowStatus = "funded";

  return {
    id: c.id,
    title: c.title || "Untitled Contract",
    reference: c.reference,
    createdAt: formatDate(c.created_at),
    sender: spName || "Service provider",
    recipient: clientName || "Client",
    clientEmail: c.client?.contact || "",
    status: c.status,
    hasEscrow,
    escrow: hasEscrow
      ? {
          amount: formatCurrency(c.payment?.amount, c.payment?.currency),
          condition:
            c.payment?.schedule === "milestone"
              ? "Released per milestone"
              : "Released on delivery",
          status: escrowStatus,
        }
      : null,
    paymentUrl: c.interswitch_payment_url,
  };
});

// ── Signature helpers ──────────────────────────────────────────────────────

const isDraft = computed(() => contract.value?.status === "draft");

const spSig = computed(() =>
  signatures.value.find((s) => s.role === "service_provider"),
);
const clientSig = computed(() =>
  signatures.value.find((s) => s.role === "client"),
);
const allSigned = computed(
  () =>
    signatures.value.length >= 2 &&
    signatures.value.every((s) => s.status === "signed"),
);
const sigsSent = computed(() => signatures.value.length > 0);

// ── Timeline steps ─────────────────────────────────────────────────────────

type StepStatus = "done" | "active" | "pending";
type EscrowStatus = "unfunded" | "funded" | "released" | "disputed";

interface StepAction {
  label: string;
  variant?: "primary" | "outline" | "danger";
  icon?: Component;
  handler: () => void;
}

interface Signer {
  name: string;
  status: "signed" | "pending";
}

interface Step {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  timestamp?: string;
  action?: StepAction;
  signers?: Signer[];
}

const steps = computed<Step[]>(() => {
  const c = contract.value;
  if (!c) return [];

  const base: Step[] = [
    {
      id: "created",
      title: "Contract created",
      description: "AI generated the contract from your conversation.",
      status: "done",
      timestamp: c.createdAt,
    },
    {
      id: "sent",
      title: "Invite sent",
      description: sigsSent.value
        ? `Signing invitation sent to ${c.recipient}.`
        : c.status === "draft"
          ? "Contract must be finalized before sending invites."
          : "Send signing invitations to proceed.",
      status: sigsSent.value ? "done" : c.status === "draft" ? "pending" : "active",
      action:
        !sigsSent.value && c.status !== "draft"
          ? {
              label: "Send invites",
              icon: LucideSend,
              handler: handleResend,
            }
          : undefined,
    },
    {
      id: "signatures",
      title: "Signatures",
      description: "Both parties must sign to activate the contract.",
      status: allSigned.value ? "done" : sigsSent.value ? "active" : "pending",
      timestamp: allSigned.value
        ? formatTimestamp(clientSig.value?.signed_at || spSig.value?.signed_at)
        : undefined,
      signers: sigsSent.value
        ? [
            {
              name: spSig.value?.signer_name || c.sender,
              status: spSig.value?.status === "signed" ? "signed" : "pending",
            },
            {
              name: clientSig.value?.signer_name || c.recipient,
              status:
                clientSig.value?.status === "signed" ? "signed" : "pending",
            },
          ]
        : undefined,
    },
  ];

  if (c.escrow) {
    const funded = c.escrow.status !== "unfunded";
    base.push(
      {
        id: "escrow-funded",
        title: "Escrow funded",
        description: funded
          ? `${c.escrow.amount} held securely until conditions are met.`
          : `${c.escrow.amount || "Payment"} to be held in escrow.`,
        status: funded ? "done" : allSigned.value ? "active" : "pending",
        action:
          !funded && allSigned.value && c.paymentUrl
            ? {
                label: "Fund escrow",
                icon: LucideWallet,
                handler: () => navigateTo(c.paymentUrl!, { external: true }),
              }
            : undefined,
      },
      {
        id: "delivery",
        title: "Work delivered",
        description: "Deliverables submitted and awaiting review.",
        status:
          c.status === "completed" ? "done" : funded ? "active" : "pending",
        action:
          funded && c.status !== "completed"
            ? {
                label: "Confirm delivery",
                icon: LucideFileCheck,
                handler: () =>
                  addToast("info", "Opening delivery confirmation..."),
              }
            : undefined,
      },
      {
        id: "escrow-released",
        title: "Payment released",
        description: "Escrow funds released to the recipient.",
        status: c.escrow.status === "released" ? "done" : "pending",
      },
    );
  }

  base.push({
    id: "complete",
    title: "Contract complete",
    description: c.escrow
      ? "All obligations fulfilled. Payment released."
      : "Both parties have signed. Contract is legally binding.",
    status: c.status === "completed" ? "done" : "pending",
  });

  return base;
});

const completedSteps = computed(
  () => steps.value.filter((s) => s.status === "done").length,
);
const progressPercent = computed(() =>
  steps.value.length
    ? Math.round((completedSteps.value / steps.value.length) * 100)
    : 0,
);

const overallStatus = computed(() => {
  if (completedSteps.value === steps.value.length) return "complete";
  if (steps.value.some((s) => s.status === "active")) return "active";
  return "pending";
});

const overallLabel = computed(() => {
  const map = {
    complete: "Completed",
    active: "In progress",
    pending: "Pending",
  };
  return map[overallStatus.value];
});

const overallIcon = computed(() => {
  const map: Record<string, Component> = {
    complete: LucideCircleCheck,
    active: LucideLoader,
    pending: LucideClock,
  };
  return map[overallStatus.value];
});

const escrowStatusLabel = computed(() => {
  if (!contract.value?.escrow) return "";
  const map: Record<EscrowStatus, string> = {
    unfunded: "Unfunded",
    funded: "Funded",
    released: "Released",
    disputed: "Disputed",
  };
  return map[contract.value.escrow.status];
});

const escrowSteps = computed(() => {
  if (!contract.value?.escrow) return [];
  const s = contract.value.escrow.status;
  return [
    { label: "Funded", done: s !== "unfunded", active: s === "unfunded" },
    { label: "Held", done: s === "released", active: s === "funded" },
    { label: "Released", done: s === "released", active: false },
  ];
});

// ── Actions ────────────────────────────────────────────────────────────────

const handleViewContract = () => navigateTo(`/contracts/${route.params.id}/view`);

const handleDownload = async () => {
  const html = contractData.value?.contract_html;
  if (!html) {
    addToast("info", "Contract document is not available yet.");
    return;
  }

  const ref = contractData.value?.reference || "contract";

  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText =
    "overflow:hidden;height:0;width:0;position:absolute;left:0;top:0;";

  const container = document.createElement("div");
  container.style.cssText =
    "width:794px;background:#fff;font-family:Georgia,serif;font-size:12pt;line-height:1.7;color:#1a1a1a;padding:40px;";
  container.innerHTML = html;

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  await new Promise((r) => setTimeout(r, 150));

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf()
      .set({
        margin: [20, 16, 20, 16],
        filename: `${ref}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
          width: 794,
          windowWidth: 794,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .save();
    addToast("success", "PDF downloaded.");
  } catch {
    addToast("error", "Failed to generate PDF.");
  } finally {
    document.body.removeChild(wrapper);
  }
};

const showEmailPrompt = ref(false);
const clientEmailInput = ref("");
const sendingInvite = ref(false);

const handleResend = async () => {
  showActions.value = false;
  if (!contractData.value) return;

  const hasEmail = !!contractData.value.client?.contact;
  if (!hasEmail) {
    clientEmailInput.value = "";
    showEmailPrompt.value = true;
    return;
  }

  await doSendInvites();
};

const handleEmailSubmit = async () => {
  const email = clientEmailInput.value.trim();
  if (!email || !email.includes("@")) {
    addToast("error", "Please enter a valid email address.");
    return;
  }
  if (!contractData.value) return;

  sendingInvite.value = true;
  try {
    await updateContract({
      id: contractData.value.id,
      data: { client: { ...contractData.value.client, contact: email } as Contract["client"] },
    });
    showEmailPrompt.value = false;
    await doSendInvites();
  } catch {
    addToast("error", "Failed to save email.");
  } finally {
    sendingInvite.value = false;
  }
};

const doSendInvites = async () => {
  if (!contractData.value) return;
  sendingInvite.value = true;
  try {
    await sendSigningLinksViaBackend(contractData.value.id);
    addToast("success", "Signing invite sent.");
    signatures.value = await getSignaturesByContract(contractData.value.id);
  } catch {
    addToast("error", "Failed to send signing links.");
  } finally {
    sendingInvite.value = false;
  }
};

const handleCancel = () => {
  showActions.value = false;
  addToast("warning", "Contract cancellation is not yet available.");
};
</script>

<style scoped>
.status-page {
  max-width: 560px;
  margin: 0 auto;
  padding: 0 0 24px;
}

.status-card__ref {
  font-weight: 600;
  color: var(--color-primary);
  margin-right: 6px;
}

/* Contract card */
.status-card {
  margin: 0 16px 16px;
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  border: 1.5px solid rgba(45, 1, 2, 0.06);
}

.status-card__top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.status-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-card__icon--active {
  background: #fffbeb;
  color: #d97706;
}

.status-card__icon--complete {
  background: #f0fdf4;
  color: #16a34a;
}

.status-card__icon--pending {
  background: #faf5f5;
  color: var(--color-primary);
}

.status-card__meta {
  flex: 1;
  min-width: 0;
}

.status-card__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 3px;
  line-height: 1.3;
}

.status-card__date {
  font-size: 13px;
  color: var(--color-gray-dark);
  margin: 0;
}

.status-card__parties {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-off-white);
  border-radius: 12px;
  margin-bottom: 14px;
}

.status-card__party {
  flex: 1;
  min-width: 0;
}

.status-card__party-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-gray-dark);
  margin-bottom: 1px;
}

.status-card__party-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-card__arrow {
  flex-shrink: 0;
  color: var(--color-gray-medium);
}

.status-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 99px;
}

.status-card__badge--active {
  background: #fffbeb;
  color: #d97706;
}

.status-card__badge--complete {
  background: #f0fdf4;
  color: #16a34a;
}

.status-card__badge--pending {
  background: rgba(45, 1, 2, 0.05);
  color: var(--color-gray-dark);
}

/* Progress bar */
.status-progress {
  margin: 0 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-progress__bar {
  height: 6px;
  border-radius: 99px;
  background: rgba(45, 1, 2, 0.06);
  overflow: hidden;
}

.status-progress__fill {
  height: 100%;
  border-radius: 99px;
  background: var(--color-primary);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.status-progress__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-gray-dark);
}

/* Timeline */
.status-timeline {
  margin: 0 16px 24px;
  padding: 20px;
  background: var(--color-white);
  border-radius: 18px;
  border: 1.5px solid rgba(45, 1, 2, 0.06);
}

.timeline-step {
  position: relative;
  display: flex;
  gap: 14px;
  padding-bottom: 24px;
}

.timeline-step:last-child {
  padding-bottom: 0;
}

/* Connector line */
.timeline-step__line {
  position: absolute;
  left: 15px;
  top: -24px;
  width: 2px;
  height: 24px;
  background: rgba(45, 1, 2, 0.08);
}

.timeline-step__line--done {
  background: var(--color-primary);
}

/* Dot */
.timeline-step__dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.3s;
}

.timeline-step--done .timeline-step__dot {
  background: var(--color-primary);
  color: var(--color-white);
}

.timeline-step--active .timeline-step__dot {
  background: #fffbeb;
  color: #d97706;
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.12);
}

.timeline-step--pending .timeline-step__dot {
  background: rgba(45, 1, 2, 0.05);
  color: var(--color-gray-medium);
}

.timeline-step__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d97706;
  animation: dot-pulse 1.5s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3);
  }
}

.timeline-step__number {
  font-size: 12px;
}

/* Content */
.timeline-step__content {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.timeline-step__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.timeline-step__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.timeline-step--pending .timeline-step__title {
  color: var(--color-gray-medium);
}

.timeline-step__time {
  font-size: 11px;
  color: var(--color-gray-dark);
  white-space: nowrap;
  flex-shrink: 0;
}

.timeline-step__desc {
  font-size: 13px;
  line-height: 1.45;
  color: var(--color-gray-dark);
  margin: 0;
}

.timeline-step--pending .timeline-step__desc {
  color: var(--color-gray-medium);
}

.timeline-step__action {
  margin-top: 12px;
}

/* Signer chips */
.timeline-step__signers {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.timeline-signer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--color-off-white);
}

.timeline-signer__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.timeline-signer--signed .timeline-signer__avatar {
  background: #f0fdf4;
  color: #16a34a;
}

.timeline-signer--pending .timeline-signer__avatar {
  background: #fffbeb;
  color: #d97706;
}

.timeline-signer__info {
  display: flex;
  flex-direction: column;
}

.timeline-signer__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.timeline-signer__status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
}

.timeline-signer--signed .timeline-signer__status {
  color: #16a34a;
}

.timeline-signer--pending .timeline-signer__status {
  color: #d97706;
}

/* Escrow tracker */
.status-escrow {
  margin: 0 16px 24px;
  padding: 20px;
  background: var(--color-white);
  border-radius: 18px;
  border: 1.5px dashed rgba(217, 119, 6, 0.3);
}

.status-escrow__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-escrow__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #fffbeb;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-escrow__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.status-escrow__subtitle {
  font-size: 12px;
  color: var(--color-gray-dark);
  margin: 1px 0 0;
}

.status-escrow__badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 99px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-escrow__badge--unfunded {
  background: #fef2f2;
  color: var(--color-accent);
}

.status-escrow__badge--funded {
  background: #fffbeb;
  color: #d97706;
}

.status-escrow__badge--released {
  background: #f0fdf4;
  color: #16a34a;
}

.status-escrow__badge--disputed {
  background: #fef2f2;
  color: var(--color-accent);
}

.status-escrow__amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-off-white);
  border-radius: 12px;
  margin-bottom: 16px;
}

.status-escrow__amount-label {
  font-size: 13px;
  color: var(--color-gray-dark);
}

.status-escrow__amount {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
}

/* Escrow mini-timeline */
.status-escrow__steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.escrow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.escrow-step__dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(45, 1, 2, 0.06);
  color: var(--color-gray-medium);
  transition: all 0.3s;
}

.escrow-step--done .escrow-step__dot {
  background: var(--color-primary);
  color: var(--color-white);
}

.escrow-step--active .escrow-step__dot {
  background: #fffbeb;
  border: 2px solid #d97706;
}

.escrow-step__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-gray-dark);
}

.escrow-step--done .escrow-step__label {
  color: var(--color-primary);
}

.escrow-step__connector {
  position: absolute;
  top: 12px;
  left: calc(50% + 16px);
  width: calc(100% - 8px);
  height: 2px;
  background: rgba(45, 1, 2, 0.08);
  z-index: -1;
}

.escrow-step__connector--done {
  background: var(--color-primary);
}

/* Quick actions */
.status-actions {
  display: flex;
  gap: 10px;
  margin: 0 16px 24px;
}

.status-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  border-radius: 14px;
  border: 1.5px solid rgba(45, 1, 2, 0.06);
  background: var(--color-white);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.15s;
}

.status-action:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: rgba(45, 1, 2, 0.02);
}

.status-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Actions menu slider */
.actions-menu {
  padding: 8px 0 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.actions-menu__item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border-radius: 12px;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.actions-menu__item:hover:not(:disabled) {
  background: rgba(45, 1, 2, 0.04);
}

.actions-menu__item:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.actions-menu__item--danger {
  color: var(--color-accent);
}

/* ── Email prompt modal ─────────────────────────────────────────────────── */

.email-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 20px;
}

.email-modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.email-modal__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 6px;
}

.email-modal__desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 18px;
}

.email-modal__input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.email-modal__input:focus {
  border-color: var(--color-primary);
}

.email-modal__actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.email-modal__btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.email-modal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.email-modal__btn--cancel {
  background: #f0f0f0;
  color: #555;
}

.email-modal__btn--send {
  background: var(--color-primary);
  color: #fff;
}
</style>
