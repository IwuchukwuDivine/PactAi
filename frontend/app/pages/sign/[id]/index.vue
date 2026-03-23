<template>
  <div class="sign-page">
    <!-- Trust header -->
    <header class="sign-header">
      <img
        src="/logo.png"
        alt="Pact AI"
        class="sign-header__logo"
        @click="router.push('/home')"
      />
      <div class="sign-header__badge">
        <LucideShieldCheck :size="14" />
        <span>Verified contract</span>
      </div>
    </header>

    <!-- Contract card -->
    <section class="sign-card">
      <div class="sign-card__top">
        <div class="sign-card__icon-wrap">
          <LucideFileText :size="28" />
        </div>
        <div class="sign-card__meta">
          <h1 class="sign-card__title">{{ contract.title }}</h1>
          <p class="sign-card__date">Created {{ contract.date }}</p>
        </div>
      </div>

      <div class="sign-card__parties">
        <div class="sign-card__party">
          <span class="sign-card__party-label">From</span>
          <span class="sign-card__party-name">{{ contract.sender }}</span>
        </div>
        <div class="sign-card__party-divider">
          <LucideArrowRight :size="16" />
        </div>
        <div class="sign-card__party">
          <span class="sign-card__party-label">To</span>
          <span class="sign-card__party-name">{{ contract.recipient }}</span>
        </div>
      </div>

      <!-- Status pill -->
      <div
        class="sign-card__status"
        :class="`sign-card__status--${contract.status}`"
      >
        <LucideClock v-if="contract.status === 'pending'" :size="14" />
        <LucideCircleCheck
          v-else-if="contract.status === 'signed'"
          :size="14"
        />
        <span>{{ statusLabel }}</span>
      </div>
    </section>

    <!-- Contract body preview -->
    <section class="sign-body">
      <h2 class="sign-body__heading">Agreement details</h2>
      <div class="sign-body__content">
        <p v-for="(para, i) in contract.paragraphs" :key="i">{{ para }}</p>
      </div>

      <!-- Key terms -->
      <div v-if="contract.terms.length" class="sign-terms">
        <h3 class="sign-terms__title">
          <LucideListChecks :size="18" />
          Key terms
        </h3>
        <ul class="sign-terms__list">
          <li
            v-for="(term, i) in contract.terms"
            :key="i"
            class="sign-terms__item"
          >
            <LucideCheck :size="14" class="sign-terms__check" />
            <span>{{ term }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Escrow notice -->
    <section v-if="contract.escrowAmount" class="sign-escrow">
      <div class="sign-escrow__icon">
        <LucideLock :size="18" />
      </div>
      <div class="sign-escrow__text">
        <p class="sign-escrow__label">Escrow protected</p>
        <p class="sign-escrow__amount">{{ contract.escrowAmount }}</p>
      </div>
    </section>

    <!-- Signature area -->
    <section class="sign-action">
      <div class="sign-action__notice">
        <LucideInfo :size="16" />
        <p>
          By signing, you agree to the terms above. This creates a legally
          timestamped record.
        </p>
      </div>

      <div class="sign-action__buttons">
        <AppButton
          title="Decline"
          variant="outline"
          block
          @click="showDecline = true"
        />
        <AppButton
          title="Sign contract"
          variant="primary"
          block
          :loading="isSigning"
          :prepend-icon="LucidePen"
          @click="showConfirm = true"
        />
      </div>
    </section>

    <!-- Confirm sign slider -->
    <BottomSlider v-model="showConfirm">
      <div class="confirm-content">
        <div class="confirm-content__icon">
          <LucideFingerprint :size="44" />
        </div>
        <h2 class="confirm-content__title">Confirm your signature</h2>
        <p class="confirm-content__desc">
          You're about to sign <strong>"{{ contract.title }}"</strong>. This
          action is final and creates a timestamped legal record.
        </p>

        <InputForm v-model="isNameValid">
          <InputField
            v-model="signatureName"
            label="Full legal name"
            placeholder="Enter your full name"
            :rules="requiredRules"
          />
        </InputForm>

        <div class="confirm-content__actions">
          <AppButton
            title="Cancel"
            variant="ghost"
            block
            @click="showConfirm = false"
          />
          <AppButton
            title="Sign now"
            variant="primary"
            block
            :loading="isSigning"
            :disabled="!isNameValid"
            :prepend-icon="LucidePen"
            @click="handleSign"
          />
        </div>
      </div>
    </BottomSlider>

    <!-- Escrow funding slider (appears after signing if contract has escrow) -->
    <BottomSlider v-model="showEscrowFund">
      <div class="escrow-fund">
        <div class="escrow-fund__icon">
          <LucideWallet :size="40" />
        </div>
        <h2 class="escrow-fund__title">Fund escrow</h2>
        <p class="escrow-fund__desc">
          This contract requires <strong>{{ contract.escrowAmount }}</strong> to
          be held in escrow until the agreed conditions are met.
        </p>

        <div class="escrow-fund__summary">
          <div class="escrow-fund__row">
            <span>Contract</span>
            <span>{{ contract.title }}</span>
          </div>
          <div class="escrow-fund__row-divider" />
          <div class="escrow-fund__row">
            <span>Amount</span>
            <strong>{{ contract.escrowAmount }}</strong>
          </div>
          <div class="escrow-fund__row-divider" />
          <div class="escrow-fund__row">
            <span>Release</span>
            <span>{{ contract.escrowCondition }}</span>
          </div>
        </div>

        <div class="escrow-fund__secure">
          <LucideShieldCheck :size="14" />
          <span
            >Funds are held securely by Pact AI and only released when
            conditions are met.</span
          >
        </div>

        <div class="escrow-fund__actions">
          <AppButton
            title="Fund later"
            variant="ghost"
            block
            @click="skipEscrow"
          />
          <AppButton
            title="Fund now"
            variant="primary"
            block
            :loading="isFunding"
            :prepend-icon="LucideWallet"
            @click="handleFundEscrow"
          />
        </div>
      </div>
    </BottomSlider>

    <!-- Decline slider -->
    <BottomSlider v-model="showDecline" title="Decline contract">
      <div class="decline-content">
        <p class="decline-content__hint">
          Optionally provide a reason for declining. The sender will be
          notified.
        </p>
        <textarea
          v-model="declineReason"
          class="decline-content__textarea"
          placeholder="Reason for declining (optional)"
          rows="3"
        />
        <div class="decline-content__actions">
          <AppButton
            title="Go back"
            variant="ghost"
            block
            @click="showDecline = false"
          />
          <AppButton
            title="Confirm decline"
            variant="danger"
            block
            :loading="isDeclining"
            @click="handleDecline"
          />
        </div>
      </div>
    </BottomSlider>
  </div>
</template>

<script setup lang="ts">
import { LucidePen, LucideFingerprint, LucideWallet } from "lucide-vue-next";
import { requiredRules } from "~/utils/types/rules";

definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const { addToast } = useToast();

useSeoMeta({
  title: "Sign Contract",
  description: "You've been invited to review and sign a contract on Pact AI. Review the terms and sign securely.",
  ogTitle: "You're invited to sign a contract — Pact AI",
  ogDescription: "Review and sign your contract securely on Pact AI.",
});

const showConfirm = ref(false);
const showDecline = ref(false);
const showEscrowFund = ref(false);
const isSigning = ref(false);
const isDeclining = ref(false);
const isFunding = ref(false);
const signatureName = ref("");
const isNameValid = ref(false);
const declineReason = ref("");

// TODO: fetch from API using route.params.id
const contract = reactive({
  title: "Logo Design for TechWave",
  date: "Mar 20, 2026",
  sender: "Adewale Johnson",
  recipient: "Chioma Nwosu",
  status: "pending" as "pending" | "signed" | "declined",
  escrowAmount: "₦350,000",
  escrowCondition: "On delivery",
  paragraphs: [
    "This agreement is between Adewale Johnson (Client) and Chioma Nwosu (Designer) for the creation of a brand logo and identity package for TechWave Solutions.",
    "The Designer agrees to deliver three initial concepts within 7 business days of signing. The Client will select one concept for refinement, with up to two rounds of revisions included.",
    "Final deliverables include the logo in SVG, PNG, and PDF formats, along with a basic brand guidelines document.",
  ],
  terms: [
    "Payment of ₦350,000 held in escrow until delivery",
    "3 initial concepts, 2 revision rounds",
    "7 business days delivery timeline",
    "All rights transfer to Client upon final payment release",
  ],
});

const statusLabel = computed(() => {
  const labels = {
    pending: "Awaiting signature",
    signed: "Signed",
    declined: "Declined",
  };
  return labels[contract.status];
});

const handleSign = async () => {
  if (!isNameValid.value) return;
  isSigning.value = true;
  try {
    // TODO: API call to sign contract
    await new Promise((r) => setTimeout(r, 1500));
    showConfirm.value = false;

    if (contract.escrowAmount) {
      setTimeout(() => {
        showEscrowFund.value = true;
      }, 350);
    } else {
      router.push(`/sign/${route.params.id}/success`);
    }
  } catch {
    addToast("error", "Failed to sign. Please try again.");
  } finally {
    isSigning.value = false;
  }
};

const handleFundEscrow = async () => {
  isFunding.value = true;
  try {
    // TODO: API call to initiate payment / fund escrow
    await new Promise((r) => setTimeout(r, 1500));
    showEscrowFund.value = false;
    addToast("success", "Escrow funded successfully!");
    router.push(`/sign/${route.params.id}/success`);
  } catch {
    addToast("error", "Payment failed. Please try again.");
  } finally {
    isFunding.value = false;
  }
};

const skipEscrow = () => {
  showEscrowFund.value = false;
  addToast("info", "You can fund escrow later from your dashboard.");
  router.push(`/sign/${route.params.id}/success`);
};

const handleDecline = async () => {
  isDeclining.value = true;
  try {
    // TODO: API call to decline contract
    await new Promise((r) => setTimeout(r, 1200));
    showDecline.value = false;
    addToast("info", "Contract declined. The sender has been notified.");
    router.replace("/");
  } catch {
    addToast("error", "Failed to decline. Please try again.");
  } finally {
    isDeclining.value = false;
  }
};
</script>

<style scoped>
.sign-page {
  min-height: 100dvh;
  background: var(--color-off-white);
  padding-bottom: 40px;
}

/* Header */
.sign-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-white);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.sign-header__logo {
  height: 32px;
  width: auto;
}

.sign-header__badge {
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
.sign-card {
  margin: 20px 16px 0;
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.sign-card__top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.sign-card__icon-wrap {
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

.sign-card__meta {
  flex: 1;
  min-width: 0;
}

.sign-card__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 4px;
  line-height: 1.25;
}

.sign-card__date {
  font-size: 13px;
  color: var(--color-gray-dark);
  margin: 0;
}

/* Parties */
.sign-card__parties {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-off-white);
  border-radius: 12px;
  margin-bottom: 16px;
}

.sign-card__party {
  flex: 1;
  min-width: 0;
}

.sign-card__party-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-gray-dark);
  margin-bottom: 2px;
}

.sign-card__party-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sign-card__party-divider {
  flex-shrink: 0;
  color: var(--color-gray-medium);
}

/* Status pill */
.sign-card__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 99px;
}

.sign-card__status--pending {
  background: #fffbeb;
  color: #d97706;
}

.sign-card__status--signed {
  background: #f0fdf4;
  color: #16a34a;
}

.sign-card__status--declined {
  background: #fef2f2;
  color: var(--color-accent);
}

/* Body */
.sign-body {
  margin: 20px 16px 0;
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.sign-body__heading {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 14px;
}

.sign-body__content p {
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-gray-dark);
  margin: 0 0 12px;
}

.sign-body__content p:last-child {
  margin-bottom: 0;
}

/* Key terms */
.sign-terms {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.sign-terms__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 12px;
}

.sign-terms__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sign-terms__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-dark);
}

.sign-terms__check {
  flex-shrink: 0;
  color: #16a34a;
  margin-top: 3px;
}

/* Escrow notice */
.sign-escrow {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 20px 16px 0;
  padding: 16px 20px;
  background: var(--color-white);
  border-radius: 18px;
  border: 1.5px dashed var(--color-gray-light);
}

.sign-escrow__icon {
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

.sign-escrow__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-gray-dark);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.sign-escrow__amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 2px 0 0;
}

/* Action area */
.sign-action {
  margin: 24px 16px 0;
}

.sign-action__notice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px 16px;
  background: #faf5f5;
  border-radius: 12px;
  margin-bottom: 20px;
}

.sign-action__notice svg {
  flex-shrink: 0;
  color: var(--color-primary);
  margin-top: 1px;
}

.sign-action__notice p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-gray-dark);
  margin: 0;
}

.sign-action__buttons {
  display: flex;
  gap: 12px;
}

/* Confirm slider content */
.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0 12px;
}

.confirm-content__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #faf5f5;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.confirm-content__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px;
}

.confirm-content__desc {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-dark);
  margin: 0 0 24px;
}

.confirm-content__desc strong {
  color: var(--color-primary);
}

.confirm-content__actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 20px;
}

/* Escrow funding slider */
.escrow-fund {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0 12px;
}

.escrow-fund__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fffbeb;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.escrow-fund__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px;
}

.escrow-fund__desc {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-dark);
  margin: 0 0 20px;
}

.escrow-fund__desc strong {
  color: var(--color-primary);
  font-weight: 700;
}

.escrow-fund__summary {
  width: 100%;
  background: var(--color-off-white);
  border-radius: 14px;
  padding: 4px 0;
  margin-bottom: 16px;
  text-align: left;
}

.escrow-fund__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  font-size: 13px;
  color: var(--color-gray-dark);
  gap: 12px;
}

.escrow-fund__row strong {
  color: var(--color-primary);
  font-weight: 700;
}

.escrow-fund__row span:last-child {
  text-align: right;
  font-weight: 600;
  color: var(--color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.escrow-fund__row-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 0 18px;
}

.escrow-fund__secure {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f0fdf4;
  font-size: 12px;
  line-height: 1.4;
  color: #16a34a;
  width: 100%;
  text-align: left;
  margin-bottom: 20px;
}

.escrow-fund__secure svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.escrow-fund__actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

/* Decline slider content */
.decline-content {
  padding: 16px 0 8px;
}

.decline-content__hint {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-dark);
  margin: 0 0 16px;
}

.decline-content__textarea {
  width: 100%;
  padding: 14px;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--color-primary);
  background: var(--color-off-white);
  border: 1.5px solid var(--color-gray-light);
  border-radius: 14px;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.decline-content__textarea:focus {
  border-color: var(--color-primary);
}

.decline-content__textarea::placeholder {
  color: var(--color-gray-medium);
}

.decline-content__actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

@media (min-width: 768px) {
  .sign-page {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .sign-header {
    max-width: 600px;
    width: 100%;
    border-radius: 0 0 18px 18px;
  }

  .sign-card,
  .sign-body,
  .sign-escrow,
  .sign-action {
    max-width: 600px;
    width: 100%;
  }
}
</style>
