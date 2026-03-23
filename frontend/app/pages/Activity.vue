<template>
  <div class="activity">
    <header class="activity__header">
      <h1 class="activity__title">Activity</h1>
    </header>

    <!-- Empty state -->
    <div class="activity__empty">
      <div class="activity__empty-icon">
        <LucideClockArrowUp :size="36" />
      </div>
      <p class="activity__empty-title">No activity yet</p>
      <p class="activity__empty-desc">
        Signatures, comments, and escrow updates will appear here.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Activity",
  description: "Track recent activity on your Pact AI contracts — signatures, escrow updates, and comments.",
});
</script>

<style scoped>
.activity {
  padding: 20px 20px 0;
  max-width: 560px;
  margin: 0 auto;
}

.activity__header {
  margin-bottom: 28px;
}

.activity__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.activity__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
}

.activity__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.04);
  color: var(--color-gray-medium);
  margin-bottom: 16px;
}

.activity__empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-black);
  margin: 0 0 6px;
}

.activity__empty-desc {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
  max-width: 260px;
  line-height: 1.5;
}
</style>
