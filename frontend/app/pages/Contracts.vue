<template>
  <div class="contracts">
    <header class="contracts__header">
      <h1 class="contracts__title">Contracts</h1>
      <button class="contracts__filter" aria-label="Filter">
        <LucideListFilter :size="20" />
      </button>
    </header>

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
        <span v-if="tab.count > 0" class="contracts__tab-badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Empty state -->
    <div class="contracts__empty">
      <div class="contracts__empty-icon">
        <LucideFolderOpen :size="36" />
      </div>
      <p class="contracts__empty-title">No contracts here</p>
      <p class="contracts__empty-desc">
        {{ emptyMessage }}
      </p>
      <AppButton
        title="Create your first"
        variant="outline"
        @click="navigateTo('/Create')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const activeTab = ref("all");

const tabs = [
  { id: "all", label: "All", count: 0 },
  { id: "pending", label: "Pending", count: 0 },
  { id: "signed", label: "Signed", count: 0 },
  { id: "escrow", label: "Escrow", count: 0 },
];

const emptyMessage = computed(() => {
  const messages: Record<string, string> = {
    all: "Your contracts will show up here once you create one.",
    pending: "No contracts waiting for signatures right now.",
    signed: "Fully signed contracts will appear here.",
    escrow: "Contracts with active escrow will appear here.",
  };
  return messages[activeTab.value] || messages.all;
});
</script>

<style scoped>
.contracts {
  padding: 20px 20px 0;
  max-width: 560px;
  margin: 0 auto;
}

.contracts__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.contracts__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.contracts__filter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(45, 1, 2, 0.04);
  border: none;
  color: var(--color-primary);
  cursor: pointer;
}

.contracts__filter:hover {
  background: rgba(45, 1, 2, 0.08);
}

/* Tabs */
.contracts__tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 28px;
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

/* Empty state */
.contracts__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  gap: 8px;
}

.contracts__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.04);
  color: var(--color-gray-medium);
  margin-bottom: 8px;
}

.contracts__empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-black);
  margin: 0;
}

.contracts__empty-desc {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0 0 16px;
  max-width: 260px;
  line-height: 1.5;
}
</style>
