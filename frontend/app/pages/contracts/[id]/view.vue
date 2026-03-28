<template>
  <div class="view-page">
    <AppHeader style="padding-right: 20px; padding-left: 20px" show-back>
      <template #action>
        <div class="view-header__badge">
          <LucideShieldCheck :size="14" />
          <span>Verified contract</span>
        </div>
      </template>
    </AppHeader>

    <SkeletonSignPage v-if="isLoading || !contract" />

    <template v-else>
      <!-- Contract card -->
      <section class="view-card">
        <div class="view-card__top">
          <div class="view-card__icon-wrap">
            <LucideFileText :size="28" />
          </div>
          <div class="view-card__meta">
            <h1 class="view-card__title">{{ contract.title }}</h1>
            <p class="view-card__sub">
              <span v-if="contract.reference" class="view-card__ref">{{
                contract.reference
              }}</span>
              Created {{ contract.date }}
            </p>
          </div>
        </div>

        <div class="view-card__parties">
          <div class="view-card__party">
            <span class="view-card__party-label">From</span>
            <span class="view-card__party-name">{{ contract.sender }}</span>
            <span v-if="contract.senderRole" class="view-card__party-role">{{
              contract.senderRole
            }}</span>
          </div>
          <div class="view-card__party-divider">
            <LucideArrowRight :size="16" />
          </div>
          <div class="view-card__party">
            <span class="view-card__party-label">To</span>
            <span class="view-card__party-name">{{ contract.recipient }}</span>
            <span v-if="contract.recipientRole" class="view-card__party-role">{{
              contract.recipientRole
            }}</span>
          </div>
        </div>

        <div
          class="view-card__status"
          :class="`view-card__status--${contract.status}`"
        >
          <LucideCircleCheck
            v-if="contract.status === 'completed'"
            :size="14"
          />
          <LucideClock v-else :size="14" />
          <span>{{ statusLabel }}</span>
        </div>
      </section>

      <!-- Full contract document (when generated) -->
      <section
        v-if="contract.contractHtml"
        class="view-body view-body--document"
      >
        <div class="view-contract-doc" v-html="contract.contractHtml" />
      </section>

      <!-- Fallback: raw input + key terms (before contract is generated) -->
      <section
        v-else-if="contract.paragraphs.length || contract.terms.length"
        class="view-body"
      >
        <h2 class="view-body__heading">Agreement details</h2>
        <div v-if="contract.paragraphs.length" class="view-body__content">
          <p v-for="(para, i) in contract.paragraphs" :key="i">{{ para }}</p>
        </div>

        <div v-if="contract.terms.length" class="view-terms">
          <h3 class="view-terms__title">
            <LucideListChecks :size="18" />
            Key terms
          </h3>
          <ul class="view-terms__list">
            <li
              v-for="(term, i) in contract.terms"
              :key="i"
              class="view-terms__item"
            >
              <LucideCheck :size="14" class="view-terms__check" />
              <span>{{ term }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Contract overview -->
      <section class="view-details">
        <h2 class="view-details__heading">Contract overview</h2>

        <div class="view-details__grid">
          <div v-if="contract.paymentAmount" class="view-detail">
            <div class="view-detail__icon view-detail__icon--green">
              <LucideBanknote :size="16" />
            </div>
            <div class="view-detail__body">
              <span class="view-detail__label">Payment</span>
              <span class="view-detail__value">{{
                contract.paymentAmount
              }}</span>
              <span v-if="contract.paymentSchedule" class="view-detail__sub">{{
                contract.paymentSchedule
              }}</span>
            </div>
          </div>

          <div v-if="contract.startDate" class="view-detail">
            <div class="view-detail__icon view-detail__icon--blue">
              <LucideCalendar :size="16" />
            </div>
            <div class="view-detail__body">
              <span class="view-detail__label">Start date</span>
              <span class="view-detail__value">{{ contract.startDate }}</span>
            </div>
          </div>

          <div v-if="contract.deadline" class="view-detail">
            <div class="view-detail__icon view-detail__icon--amber">
              <LucideTarget :size="16" />
            </div>
            <div class="view-detail__body">
              <span class="view-detail__label">Deadline</span>
              <span class="view-detail__value">{{ contract.deadline }}</span>
            </div>
          </div>
        </div>

        <!-- Deliverables -->
        <div v-if="contract.deliverableItems.length" class="view-deliverables">
          <div class="view-deliverables__header">
            <LucidePackage :size="16" />
            <span>Deliverables</span>
          </div>
          <ul class="view-deliverables__list">
            <li v-for="(item, i) in contract.deliverableItems" :key="i">
              {{ item }}
            </li>
          </ul>
        </div>
      </section>

      <!-- Ambiguities -->
      <section v-if="contract.ambiguities.length" class="view-ambiguities">
        <div class="view-ambiguities__header">
          <div class="view-ambiguities__icon">
            <LucideAlertTriangle :size="18" />
          </div>
          <div>
            <h3 class="view-ambiguities__title">Flagged ambiguities</h3>
            <p class="view-ambiguities__subtitle">
              {{ contract.ambiguities.length }} item{{
                contract.ambiguities.length > 1 ? "s" : ""
              }}
              need clarification
            </p>
          </div>
        </div>

        <div class="view-ambiguities__list">
          <div
            v-for="(amb, i) in contract.ambiguities"
            :key="i"
            class="view-ambiguity"
          >
            <div class="view-ambiguity__phrase">"{{ amb.phrase }}"</div>
            <p class="view-ambiguity__reason">{{ amb.reason }}</p>
            <p class="view-ambiguity__question">
              <strong>Clarification:</strong> {{ amb.clarification_question }}
            </p>
          </div>
        </div>
      </section>

      <!-- Escrow notice -->
      <section v-if="contract.escrowAmount" class="view-escrow">
        <div class="view-escrow__icon">
          <LucideLock :size="18" />
        </div>
        <div class="view-escrow__text">
          <p class="view-escrow__label">Escrow protected</p>
          <p class="view-escrow__amount">{{ contract.escrowAmount }}</p>
        </div>
      </section>

      <!-- Actions -->
      <section class="view-actions">
        <AppButton
          title="Download PDF"
          variant="outline"
          block
          :prepend-icon="LucideDownload"
          :disabled="!hasPdf"
          @click="handleDownload"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  LucideBanknote,
  LucideCalendar,
  LucideTarget,
  LucidePackage,
  LucideAlertTriangle,
  LucideDownload,
} from "lucide-vue-next";
import type { TimelineMilestone } from "~/utils/types/api";
import { useContractQuery } from "~/composables/useRequest";

definePageMeta({ layout: false });

const route = useRoute();
const { addToast } = useToast();

useSeoMeta({
  title: "View Contract",
  description: "Review your Pact AI contract details, terms, and conditions.",
});

const contractId = computed(() => route.params.id as string);
const { data: contractData, isLoading } = useContractQuery(contractId);

const hasPdf = computed(() => !!contractData.value?.contract_html);

const isPlaceholder = (v?: string) =>
  !v || /^\s*<?\s*unknown\s*>?\s*$/i.test(v);

const contract = computed(() => {
  const c = contractData.value;
  if (!c) return null;

  const spName = isPlaceholder(c.service_provider?.name)
    ? "Service provider"
    : c.service_provider!.name;
  const clientName = isPlaceholder(c.client?.name) ? "Client" : c.client!.name;

  const payment = c.payment || c.extracted_terms?.payment;
  const deliverables = c.deliverables || c.extracted_terms?.deliverables;
  const ambiguities = c.ambiguities || c.extracted_terms?.ambiguities || [];
  const milestones =
    c.timeline?.milestones || c.extracted_terms?.timeline?.milestones || [];
  const deadline =
    c.timeline?.deadline || c.extracted_terms?.timeline?.deadline;
  const startMilestone = milestones.find((m: TimelineMilestone) =>
    m.title?.toLowerCase().includes("start"),
  );

  const hasEscrow = c.escrow_proposed || c.escrow_active;
  const escrowAmt = formatCurrency(payment?.amount, payment?.currency);

  const scheduleLabels: Record<string, string> = {
    upfront: "Upfront",
    on_delivery: "On delivery",
    milestone: "Per milestone",
    split: "Split payment",
  };

  const terms: string[] = [];
  if (payment?.amount)
    terms.push(`Payment: ${escrowAmt}${hasEscrow ? " (escrow)" : ""}`);
  if (deliverables?.items?.length) {
    deliverables.items
      .filter((d) => !isPlaceholder(d))
      .forEach((d) => terms.push(d));
  }
  if (deadline) terms.push(`Deadline: ${formatDate(deadline)}`);
  if (deliverables?.revision_limit != null)
    terms.push(`${deliverables.revision_limit} revision rounds`);

  const paragraphs: string[] = [];
  if (c.raw_input) paragraphs.push(c.raw_input);

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    negotiating: "Negotiating",
    pending_signatures: "Pending signatures",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Disputed",
  };

  return {
    title: c.title || "Untitled Contract",
    reference: c.reference,
    date: formatDate(c.created_at),
    sender: spName,
    senderRole:
      c.service_provider?.role || c.extracted_terms?.service_provider?.role,
    recipient: clientName,
    recipientRole: c.client?.role || c.extracted_terms?.client?.role,
    status: c.status,
    statusLabel: statusLabels[c.status] || c.status,
    contractHtml: c.contract_html || "",
    escrowAmount: hasEscrow ? escrowAmt : "",
    paragraphs,
    terms,
    paymentAmount: formatCurrency(payment?.amount, payment?.currency),
    paymentSchedule: payment?.schedule
      ? scheduleLabels[payment.schedule] || payment.schedule
      : undefined,
    startDate: startMilestone?.due_date
      ? formatDate(startMilestone.due_date)
      : undefined,
    deadline: deadline ? formatDate(deadline) : undefined,
    deliverableItems:
      deliverables?.items?.filter((d) => !isPlaceholder(d)) || [],
    ambiguities,
  };
});

const statusLabel = computed(() => contract.value?.statusLabel || "");

const handleDownload = async () => {
  const html = contract.value?.contractHtml;
  if (!html) {
    addToast("info", "Contract document is not available yet.");
    return;
  }

  const ref = contract.value?.reference || "contract";

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

</script>

<style scoped>
.view-page {
  min-height: 100dvh;
  background: var(--color-off-white);
  padding-bottom: 40px;
}

.view-header__logo {
  height: 32px;
  width: auto;
  cursor: pointer;
}

.view-header__badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  background: #f0fdf4;
  padding: 5px 10px;
  border-radius: 99px;
}

/* Contract card */
.view-card {
  margin: 20px 16px 0;
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.view-card__top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.view-card__icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #faf5f5;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.view-card__meta {
  flex: 1;
  min-width: 0;
}

.view-card__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 4px;
  line-height: 1.25;
}

.view-card__sub {
  font-size: 13px;
  color: var(--color-gray-dark);
  margin: 0;
}

.view-card__ref {
  font-weight: 600;
  color: var(--color-primary);
  margin-right: 6px;
}

/* Parties */
.view-card__parties {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-off-white);
  border-radius: 12px;
  margin-bottom: 16px;
}

.view-card__party {
  flex: 1;
  min-width: 0;
}

.view-card__party-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-gray-dark);
  margin-bottom: 2px;
}

.view-card__party-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-card__party-role {
  display: block;
  font-size: 11px;
  color: var(--color-gray-dark);
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-card__party-divider {
  flex-shrink: 0;
  color: var(--color-gray-medium);
}

/* Status pill */
.view-card__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 99px;
}

.view-card__status--completed {
  background: #f0fdf4;
  color: #16a34a;
}

.view-card__status--active,
.view-card__status--negotiating,
.view-card__status--pending_signatures {
  background: #fffbeb;
  color: #d97706;
}

.view-card__status--draft {
  background: rgba(45, 1, 2, 0.05);
  color: var(--color-gray-dark);
}

.view-card__status--cancelled,
.view-card__status--disputed {
  background: #fef2f2;
  color: var(--color-accent);
}

/* Agreement body */
.view-body {
  margin: 20px 16px 0;
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.view-body__heading {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 14px;
}

.view-body__content p {
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-gray-dark);
  margin: 0 0 12px;
}

.view-body__content p:last-child {
  margin-bottom: 0;
}

/* Rendered contract document */
.view-contract-doc {
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 13px;
  line-height: 1.7;
  color: #1a1a1a;
}

.view-contract-doc :deep(h1) {
  font-size: 18px;
  text-align: center;
  margin: 0 0 4px;
  color: #111;
}

.view-contract-doc :deep(h2) {
  font-size: 14px;
  font-weight: 700;
  margin: 24px 0 8px;
  color: #222;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 4px;
}

.view-contract-doc :deep(p) {
  margin: 0 0 10px;
}

.view-contract-doc :deep(ul),
.view-contract-doc :deep(ol) {
  margin: 8px 0 16px 20px;
  padding: 0;
}

.view-contract-doc :deep(li) {
  margin-bottom: 4px;
}

.view-contract-doc :deep(hr) {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 24px 0;
}

.view-contract-doc :deep(strong) {
  font-weight: 700;
}

/* Key terms */
.view-terms {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.view-terms__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 12px;
}

.view-terms__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.view-terms__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-dark);
}

.view-terms__check {
  flex-shrink: 0;
  color: #16a34a;
  margin-top: 3px;
}

/* Contract details */
.view-details {
  margin: 20px 16px 0;
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.view-details__heading {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 16px;
}

.view-details__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.view-detail {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.view-detail__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(45, 1, 2, 0.04);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.view-detail__icon--green {
  background: #f0fdf4;
  color: #16a34a;
}

.view-detail__icon--blue {
  background: #eff6ff;
  color: #2563eb;
}

.view-detail__icon--amber {
  background: #fffbeb;
  color: #d97706;
}

.view-detail__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.view-detail__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--color-gray-dark);
  margin-bottom: 1px;
}

.view-detail__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1.3;
}

.view-detail__sub {
  font-size: 12px;
  color: var(--color-gray-dark);
  margin-top: 1px;
}

/* Deliverables */
.view-deliverables {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.view-deliverables__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 10px;
}

.view-deliverables__list {
  margin: 0;
  padding: 0 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-deliverables__list li {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-dark);
}

.view-deliverables__list li::marker {
  color: var(--color-primary);
}

/* Ambiguities */
.view-ambiguities {
  margin: 20px 16px 0;
  padding: 20px;
  background: var(--color-white);
  border-radius: 18px;
  border: 1.5px solid rgba(217, 119, 6, 0.2);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.view-ambiguities__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.view-ambiguities__icon {
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

.view-ambiguities__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.view-ambiguities__subtitle {
  font-size: 12px;
  color: var(--color-gray-dark);
  margin: 1px 0 0;
}

.view-ambiguities__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.view-ambiguity {
  padding: 14px;
  border-radius: 12px;
  background: rgba(217, 119, 6, 0.04);
}

.view-ambiguity__phrase {
  font-size: 13px;
  font-weight: 600;
  font-style: italic;
  color: #92400e;
  margin-bottom: 6px;
  line-height: 1.4;
}

.view-ambiguity__reason {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-gray-dark);
  margin: 0 0 8px;
}

.view-ambiguity__question {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-primary);
  margin: 0;
  padding: 10px 12px;
  background: var(--color-white);
  border-radius: 8px;
  border-left: 3px solid #d97706;
}

.view-ambiguity__question strong {
  color: #d97706;
}

/* Escrow notice */
.view-escrow {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 20px 16px 0;
  padding: 16px 20px;
  background: var(--color-white);
  border-radius: 18px;
  border: 1.5px dashed var(--color-gray-light);
}

.view-escrow__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #fffbeb;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.view-escrow__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-gray-dark);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.view-escrow__amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 2px 0 0;
}

/* Actions */
.view-actions {
  display: flex;
  gap: 12px;
  margin: 24px 16px 0;
}

@media (min-width: 768px) {
  .view-page {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .view-card,
  .view-body,
  .view-details,
  .view-ambiguities,
  .view-escrow,
  .view-actions {
    max-width: 600px;
    width: 100%;
  }
}
</style>
