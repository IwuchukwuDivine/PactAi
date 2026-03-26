<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <component :is="icon" :size="36" />
    </div>
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";

defineOptions({ name: "EmptyState" });

defineProps<{
  icon: Component;
  title: string;
  description?: string;
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 56px 24px;
}

.empty-state__icon {
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

.empty-state__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-black);
  margin: 0 0 6px;
}

.empty-state__desc {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0 0 24px;
  max-width: 280px;
  line-height: 1.5;
}

.empty-state__action {
  display: flex;
}
</style>
