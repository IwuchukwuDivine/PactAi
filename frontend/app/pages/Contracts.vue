<template>
  <div class="contracts">
    <AppHeader title="Contracts">
      <template #action>
        <button aria-label="Filter">
          <LucideListFilter :size="20" />
        </button>
      </template>
    </AppHeader>

    <!-- Tabs -->
    <div class="contracts__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="contracts__tab"
        :class="{ 'contracts__tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="contracts__tab-badge">{{
          tab.count
        }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="contracts__loading">
      <p>Loading contracts...</p>
    </div>

    <!-- Contract list -->
    <div v-else-if="filteredContracts.length" class="contracts__list">
      <button
        v-for="contract in filteredContracts"
        :key="contract.id"
        class="contracts__card"
        @click="navigateTo(`/contracts/${contract.id}`)"
      >
        <div class="contracts__card-top">
          <span class="contracts__card-title">{{
            contract.title || "Untitled"
          }}</span>
          <span
            class="contracts__card-status"
            :class="`contracts__card-status--${contract.status}`"
          >
            {{ statusLabels[contract.status] || contract.status }}
          </span>
        </div>
        <p v-if="partiesLabel(contract)" class="contracts__card-parties">
          {{ partiesLabel(contract) }}
        </p>
        <span class="contracts__card-date">{{
          formatDate(contract.created_at)
        }}</span>
      </button>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else
      :icon="LucideFolderOpen"
      title="No contracts here"
      :description="emptyMessage"
    >
      <template #action>
        <AppButton
          title="Start a chat"
          variant="outline"
          @click="navigateTo('/Chat')"
        />
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import { LucideFolderOpen, LucideListFilter } from "lucide-vue-next";
import type { Contract } from "~/utils/types/api";
import { useContractsQuery } from "~/composables/useRequest";

definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "My Contracts",
  description:
    "View and manage all your Pact AI contracts — active, pending, and completed agreements.",
});

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending_signatures: "Pending",
  negotiating: "Under review",
  signed: "Signed",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

const { data: contractsData, isLoading } = useContractsQuery();
const contracts = computed<Contract[]>(() => contractsData.value ?? []);

const activeTab = ref("all");

const tabs = computed(() => [
  { id: "all", label: "All", count: contracts.value.length },
  {
    id: "pending",
    label: "Pending",
    count: contracts.value.filter(
      (c) => c.status === "pending_signatures" || c.status === "negotiating",
    ).length,
  },
  {
    id: "signed",
    label: "Signed",
    count: contracts.value.filter(
      (c) => c.status === "signed" || c.status === "completed",
    ).length,
  },
  {
    id: "escrow",
    label: "Escrow",
    count: contracts.value.filter((c) => c.escrow_proposed).length,
  },
]);

const filteredContracts = computed(() => {
  if (activeTab.value === "all") return contracts.value;
  if (activeTab.value === "pending") {
    return contracts.value.filter(
      (c) =>
        c.status === "pending_signatures" ||
        c.status === "negotiating" ||
        c.status === "draft",
    );
  }
  if (activeTab.value === "signed") {
    return contracts.value.filter(
      (c) => c.status === "signed" || c.status === "completed",
    );
  }
  if (activeTab.value === "escrow") {
    return contracts.value.filter((c) => c.escrow_proposed);
  }
  return contracts.value;
});

const emptyMessage = computed(() => {
  const messages: Record<string, string> = {
    all: "Your contracts will show up here once you create one.",
    pending: "No contracts waiting for signatures right now.",
    signed: "Fully signed contracts will appear here.",
    escrow: "Contracts with active escrow will appear here.",
  };
  return messages[activeTab.value] || messages.all;
});

const partiesLabel = (contract: Contract) => {
  const names = [contract.service_provider?.name, contract.client?.name].filter(
    Boolean,
  );
  return names.length ? names.join(" ↔ ") : "";
};
</script>

<style scoped>
.contracts {
  padding: 20px 20px 0;
  max-width: 560px;
  margin: 0 auto;
}

/* Tabs */
.contracts__tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.contracts__tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 20px;
  border: 1.5px solid rgba(45, 1, 2, 0.08);
  background: var(--color-white);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-gray-dark);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.contracts__tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.contracts__tab-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  padding: 0 6px;
}

.contracts__tab:not(.contracts__tab--active) .contracts__tab-badge {
  background: rgba(45, 1, 2, 0.06);
}

/* Loading */
.contracts__loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
  color: var(--color-gray-dark);
  font-size: 14px;
}

/* Contract list */
.contracts__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contracts__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(45, 1, 2, 0.07);
  background: var(--color-white);
  text-align: left;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
}

.contracts__card:hover {
  border-color: var(--color-primary);
  background: rgba(45, 1, 2, 0.01);
}

.contracts__card:active {
  transform: scale(0.99);
}

.contracts__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.contracts__card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.contracts__card-status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.contracts__card-status--draft {
  background: rgba(45, 1, 2, 0.06);
  color: var(--color-gray-dark);
}

.contracts__card-status--signed,
.contracts__card-status--completed {
  background: #f0fdf4;
  color: #16a34a;
}

.contracts__card-status--pending_signatures,
.contracts__card-status--negotiating {
  background: #fffbeb;
  color: #d97706;
}

.contracts__card-status--disputed,
.contracts__card-status--cancelled {
  background: rgba(170, 1, 1, 0.06);
  color: var(--color-accent);
}

.contracts__card-parties {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
}

.contracts__card-date {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-gray-muted);
}
</style>
