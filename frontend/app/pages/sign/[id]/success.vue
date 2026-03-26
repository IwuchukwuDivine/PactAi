<template>
  <div class="success-page">
    <div v-if="isLoading" class="success-content">
      <div class="success-loading__spinner" />
    </div>

    <div v-else-if="contract" class="success-content">
      <!-- Animated check -->
      <div class="success-check">
        <div class="success-check__ring" />
        <LucideCircleCheck :size="56" class="success-check__icon" />
      </div>

      <h1 class="success-title">Contract signed!</h1>
      <p class="success-desc">
        Your signature has been recorded and timestamped. Both parties will
        receive a confirmed copy.
      </p>

      <!-- Details card -->
      <div class="success-card">
        <div class="success-card__row">
          <span class="success-card__label">Contract</span>
          <span class="success-card__value">{{ contract.title }}</span>
        </div>
        <div class="success-card__divider" />
        <div class="success-card__row">
          <span class="success-card__label">Signed by</span>
          <span class="success-card__value">{{ contract.signedBy }}</span>
        </div>
        <div class="success-card__divider" />
        <div class="success-card__row">
          <span class="success-card__label">Timestamp</span>
          <span class="success-card__value">{{ contract.timestamp }}</span>
        </div>
        <div v-if="contract.escrowAmount" class="success-card__divider" />
        <div v-if="contract.escrowAmount" class="success-card__row">
          <span class="success-card__label">Escrow</span>
          <span class="success-card__value success-card__value--escrow">
            <LucideLock :size="13" />
            {{ contract.escrowAmount }}
          </span>
        </div>
      </div>

      <!-- Trust badges -->
      <div class="success-badges">
        <div class="success-badge">
          <LucideShieldCheck :size="16" />
          <span>Legally timestamped</span>
        </div>
        <div class="success-badge">
          <LucideLock :size="16" />
          <span>Encrypted</span>
        </div>
        <div class="success-badge">
          <LucideFileCheck :size="16" />
          <span>NDPR compliant</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="success-actions">
        <AppButton
          title="View contract"
          variant="primary"
          block
          :prepend-icon="LucideFileText"
          @click="viewContract"
        />
        <AppButton
          title="Download PDF"
          variant="outline"
          block
          :prepend-icon="LucideDownload"
          @click="downloadPdf"
        />
      </div>

      <button class="success-home" @click="navigateTo('/Home')">
        Go to dashboard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LucideFileText, LucideDownload } from "lucide-vue-next";
import type { Contract } from "~/utils/types/api";

definePageMeta({ layout: false });

const route = useRoute();
const { addToast } = useToast();
const { getContractByToken } = useSignContract();

useSeoMeta({
  title: "Contract Signed",
  description:
    "Contract signed successfully on Pact AI. Your digitally signed agreement is now legally binding.",
});

const signingToken = computed(() => route.params.id as string);
const isLoading = ref(true);
const contractData = ref<Contract | null>(null);
const signerName = ref("");
const signerSignedAt = ref("");

onMounted(async () => {
  const result = await getContractByToken(signingToken.value);
  if (result) {
    contractData.value = result.contracts;
    signerName.value =
      result.role === "service_provider"
        ? result.contracts.service_provider?.name || "Service provider"
        : result.contracts.client?.name || "Client";
    signerSignedAt.value = new Date().toLocaleString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }
  isLoading.value = false;
});

const isPlaceholder = (v?: string) =>
  !v || /^\s*<?\s*unknown\s*>?\s*$/i.test(v);

const contract = computed(() => {
  const c = contractData.value;
  if (!c) return null;
  const hasEscrow = c.escrow_proposed || c.escrow_active;
  return {
    title: c.title || "Untitled Contract",
    signedBy: isPlaceholder(signerName.value) ? "Signer" : signerName.value,
    timestamp: signerSignedAt.value,
    escrowAmount: hasEscrow
      ? formatCurrency(c.payment?.amount, c.payment?.currency)
      : "",
  };
});

const viewContract = () => {
  navigateTo(`/sign/${route.params.id}`);
};

const downloadPdf = () => {
  if (contractData.value?.contract_pdf_url) {
    navigateTo(contractData.value.contract_pdf_url, { external: true });
  } else {
    addToast("info", "PDF download will be available shortly.");
  }
};
</script>

<style scoped>
.success-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 40px 20px;
  background: var(--color-white);
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 420px;
}

.success-loading__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-gray-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: success-spin 0.7s linear infinite;
}

@keyframes success-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Animated check */
.success-check {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}

.success-check__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid #16a34a;
  opacity: 0;
  animation: ring-pop 0.6s ease-out 0.2s forwards;
}

.success-check__icon {
  color: #16a34a;
  opacity: 0;
  transform: scale(0.5);
  animation: icon-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
}

@keyframes ring-pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 0.2;
  }
}

@keyframes icon-pop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Title */
.success-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 10px;
  line-height: 1.2;
}

.success-desc {
  font-size: 15px;
  line-height: 1.55;
  color: var(--color-gray-dark);
  margin: 0 0 30px;
  max-width: 340px;
}

/* Details card */
.success-card {
  width: 100%;
  background: var(--color-off-white);
  border-radius: 16px;
  padding: 4px 0;
  margin-bottom: 24px;
}

.success-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  gap: 12px;
}

.success-card__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-gray-dark);
  flex-shrink: 0;
}

.success-card__value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.success-card__value--escrow {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #d97706;
}

.success-card__divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 0 20px;
}

/* Trust badges */
.success-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

.success-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-gray-dark);
  padding: 6px 12px;
  background: var(--color-off-white);
  border-radius: 99px;
}

.success-badge svg {
  color: #16a34a;
}

/* Actions */
.success-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 20px;
}

.success-home {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-primary);
  background: none;
  border: none;
  text-decoration: underline;
  text-underline-offset: 4px;
  padding: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.success-home:hover {
  opacity: 0.7;
}

@media (min-width: 768px) {
  .success-title {
    font-size: 34px;
  }

  .success-desc {
    font-size: 16px;
  }
}
</style>
