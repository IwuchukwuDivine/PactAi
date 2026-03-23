<template>
  <div class="status-page">
    <!-- Header -->
    <header class="status-header">
      <button class="status-header__back" @click="navigateTo('/Contracts')">
        <LucideArrowLeft :size="20" />
      </button>
      <h1 class="status-header__title">Contract Status</h1>
      <button class="status-header__more" @click="showActions = true">
        <LucideEllipsisVertical :size="20" />
      </button>
    </header>

    <!-- Contract summary card -->
    <section class="status-card">
      <div class="status-card__top">
        <div class="status-card__icon" :class="`status-card__icon--${overallStatus}`">
          <component :is="overallIcon" :size="24" />
        </div>
        <div class="status-card__meta">
          <h2 class="status-card__title">{{ contract.title }}</h2>
          <p class="status-card__date">Created {{ contract.createdAt }}</p>
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
          <span class="status-card__party-name">{{ contract.recipient }}</span>
        </div>
      </div>

      <!-- Overall status badge -->
      <div class="status-card__badge" :class="`status-card__badge--${overallStatus}`">
        <component :is="overallIcon" :size="14" />
        <span>{{ overallLabel }}</span>
      </div>
    </section>

    <!-- Progress bar -->
    <section class="status-progress">
      <div class="status-progress__bar">
        <div class="status-progress__fill" :style="{ width: progressPercent + '%' }" />
      </div>
      <span class="status-progress__label">{{ completedSteps }} of {{ steps.length }} steps complete</span>
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
        <div v-if="i > 0" class="timeline-step__line" :class="{ 'timeline-step__line--done': step.status === 'done' }" />

        <div class="timeline-step__dot">
          <LucideCheck v-if="step.status === 'done'" :size="14" />
          <div v-else-if="step.status === 'active'" class="timeline-step__pulse" />
          <span v-else class="timeline-step__number">{{ i + 1 }}</span>
        </div>

        <div class="timeline-step__content">
          <div class="timeline-step__header">
            <h3 class="timeline-step__title">{{ step.title }}</h3>
            <span v-if="step.timestamp" class="timeline-step__time">{{ step.timestamp }}</span>
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
              <div class="timeline-signer__avatar">{{ signer.name.charAt(0) }}</div>
              <div class="timeline-signer__info">
                <span class="timeline-signer__name">{{ signer.name }}</span>
                <span class="timeline-signer__status">
                  <LucideCircleCheck v-if="signer.status === 'signed'" :size="12" />
                  <LucideClock v-else :size="12" />
                  {{ signer.status === 'signed' ? 'Signed' : 'Pending' }}
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
          <p class="status-escrow__subtitle">{{ contract.escrow.condition }}</p>
        </div>
        <div class="status-escrow__badge" :class="`status-escrow__badge--${contract.escrow.status}`">
          {{ escrowStatusLabel }}
        </div>
      </div>

      <div class="status-escrow__amount-row">
        <span class="status-escrow__amount-label">Amount held</span>
        <span class="status-escrow__amount">{{ contract.escrow.amount }}</span>
      </div>

      <!-- Escrow mini-timeline -->
      <div class="status-escrow__steps">
        <div
          v-for="(es, i) in escrowSteps"
          :key="es.label"
          class="escrow-step"
          :class="{ 'escrow-step--done': es.done, 'escrow-step--active': es.active }"
        >
          <div class="escrow-step__dot">
            <LucideCheck v-if="es.done" :size="10" />
          </div>
          <span class="escrow-step__label">{{ es.label }}</span>
          <div v-if="i < escrowSteps.length - 1" class="escrow-step__connector" :class="{ 'escrow-step__connector--done': es.done }" />
        </div>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="status-actions">
      <button class="status-action" @click="handleViewContract">
        <LucideFileText :size="18" />
        <span>View contract</span>
      </button>
      <button class="status-action" @click="handleDownload">
        <LucideDownload :size="18" />
        <span>Download PDF</span>
      </button>
      <button class="status-action" @click="handleShare">
        <LucideShare2 :size="18" />
        <span>Share link</span>
      </button>
    </section>

    <!-- Actions bottom slider -->
    <BottomSlider v-model="showActions" title="Actions">
      <div class="actions-menu">
        <button class="actions-menu__item" @click="handleResend">
          <LucideSend :size="18" />
          <span>Resend invite</span>
        </button>
        <button class="actions-menu__item" @click="handleViewContract">
          <LucideFileText :size="18" />
          <span>View full contract</span>
        </button>
        <button class="actions-menu__item" @click="handleDownload">
          <LucideDownload :size="18" />
          <span>Download PDF</span>
        </button>
        <button class="actions-menu__item actions-menu__item--danger" @click="handleCancel">
          <LucideCircleX :size="18" />
          <span>Cancel contract</span>
        </button>
      </div>
    </BottomSlider>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import {
  LucideFileText,
  LucideDownload,
  LucideShare2,
  LucideSend,
  LucideCircleX,
  LucideCircleCheck,
  LucideClock,
  LucideLoader,
  LucideFileCheck,
  LucideWallet,
} from "lucide-vue-next";

definePageMeta({ layout: "dashboard" });

const route = useRoute();
const { addToast } = useToast();
const showActions = ref(false);

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

// TODO: fetch from API using route.params.id
const contract = reactive({
  title: "Logo Design for TechWave",
  createdAt: "Mar 20, 2026",
  sender: "Adewale Johnson",
  recipient: "Chioma Nwosu",
  currentStep: 3,
  escrow: {
    amount: "₦350,000",
    condition: "Released on delivery",
    status: "funded" as EscrowStatus,
  } as { amount: string; condition: string; status: EscrowStatus } | null,
});

const steps = computed<Step[]>(() => {
  const base: Step[] = [
    {
      id: "created",
      title: "Contract created",
      description: "AI generated the contract from your conversation.",
      status: "done",
      timestamp: "Mar 20, 2:30 PM",
    },
    {
      id: "sent",
      title: "Invite sent",
      description: `Signing invitation sent to ${contract.recipient}.`,
      status: "done",
      timestamp: "Mar 20, 2:31 PM",
    },
    {
      id: "signatures",
      title: "Signatures",
      description: "Both parties must sign to activate the contract.",
      status: contract.currentStep >= 3 ? "done" : contract.currentStep === 2 ? "active" : "pending",
      timestamp: contract.currentStep >= 3 ? "Mar 21, 10:15 AM" : undefined,
      signers: [
        { name: contract.sender, status: contract.currentStep >= 2 ? "signed" : "pending" },
        { name: contract.recipient, status: contract.currentStep >= 3 ? "signed" : "pending" },
      ],
    },
  ];

  if (contract.escrow) {
    base.push(
      {
        id: "escrow-funded",
        title: "Escrow funded",
        description: `${contract.escrow.amount} held securely until conditions are met.`,
        status: contract.escrow.status === "unfunded"
          ? (contract.currentStep >= 3 ? "active" : "pending")
          : "done",
        timestamp: contract.escrow.status !== "unfunded" ? "Mar 21, 10:20 AM" : undefined,
        action: contract.escrow.status === "unfunded" && contract.currentStep >= 3
          ? { label: "Fund escrow", icon: LucideWallet, handler: () => addToast("info", "Redirecting to payment...") }
          : undefined,
      },
      {
        id: "delivery",
        title: "Work delivered",
        description: "Deliverables submitted and awaiting review.",
        status: contract.currentStep >= 5 ? "done" : contract.currentStep === 4 ? "active" : "pending",
        action: contract.currentStep === 4
          ? { label: "Confirm delivery", icon: LucideFileCheck, handler: () => addToast("info", "Opening delivery confirmation...") }
          : undefined,
      },
      {
        id: "escrow-released",
        title: "Payment released",
        description: "Escrow funds released to the recipient.",
        status: contract.currentStep >= 6 ? "done" : "pending",
        timestamp: contract.currentStep >= 6 ? "Mar 28, 3:00 PM" : undefined,
      },
    );
  }

  base.push({
    id: "complete",
    title: "Contract complete",
    description: contract.escrow
      ? "All obligations fulfilled. Payment released."
      : "Both parties have signed. Contract is legally binding.",
    status: contract.currentStep >= (contract.escrow ? 7 : 4) ? "done" : "pending",
  });

  return base;
});

const completedSteps = computed(() => steps.value.filter((s) => s.status === "done").length);
const progressPercent = computed(() => Math.round((completedSteps.value / steps.value.length) * 100));

const overallStatus = computed(() => {
  if (completedSteps.value === steps.value.length) return "complete";
  if (steps.value.some((s) => s.status === "active")) return "active";
  return "pending";
});

const overallLabel = computed(() => {
  const map = { complete: "Completed", active: "In progress", pending: "Pending" };
  return map[overallStatus.value];
});

const overallIcon = computed(() => {
  const map: Record<string, Component> = { complete: LucideCircleCheck, active: LucideLoader, pending: LucideClock };
  return map[overallStatus.value];
});

const escrowStatusLabel = computed(() => {
  if (!contract.escrow) return "";
  const map: Record<EscrowStatus, string> = {
    unfunded: "Unfunded",
    funded: "Funded",
    released: "Released",
    disputed: "Disputed",
  };
  return map[contract.escrow.status];
});

const escrowSteps = computed(() => {
  if (!contract.escrow) return [];
  const s = contract.escrow.status;
  return [
    { label: "Funded", done: s !== "unfunded", active: s === "unfunded" },
    { label: "Held", done: s === "released", active: s === "funded" },
    { label: "Released", done: s === "released", active: false },
  ];
});

const handleViewContract = () => navigateTo(`/sign/${route.params.id}`);
const handleDownload = () => addToast("info", "PDF download will be available shortly.");
const handleShare = () => {
  navigator.clipboard.writeText(`${window.location.origin}/sign/${route.params.id}`);
  addToast("success", "Contract link copied to clipboard.");
};
const handleResend = () => {
  showActions.value = false;
  addToast("success", "Signing invite resent.");
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

/* Header */
.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.status-header__back,
.status-header__more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: none;
  border: 1.5px solid rgba(45, 1, 2, 0.08);
  color: var(--color-primary);
  transition: background 0.15s;
}

.status-header__back:hover,
.status-header__more:hover {
  background: rgba(45, 1, 2, 0.04);
}

.status-header__title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
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
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
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

.status-action:hover {
  border-color: var(--color-primary);
  background: rgba(45, 1, 2, 0.02);
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

.actions-menu__item:hover {
  background: rgba(45, 1, 2, 0.04);
}

.actions-menu__item--danger {
  color: var(--color-accent);
}
</style>
