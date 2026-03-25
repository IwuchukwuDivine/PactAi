<template>
  <header class="app-header">
    <button
      v-if="showBack"
      class="app-header__back"
      aria-label="Go back"
      @click="goBack()"
    >
      <LucideArrowLeft :size="20" />
    </button>

    <div class="app-header__text">
      <slot name="title">
        <h1 class="app-header__title">{{ title }}</h1>
      </slot>
      <p v-if="subtitle" class="app-header__subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="$slots.action" class="app-header__action">
      <slot name="action" />
    </div>
  </header>
</template>

<script setup lang="ts">
import goBack from "~/utils/goBack";

defineOptions({ name: "AppHeaderBar" });

defineProps<{
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}>();
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0 12px;
  background: var(--color-white);
  z-index: 20;
}

.app-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: none;
  border: 1.5px solid rgba(45, 1, 2, 0.08);
  color: var(--color-primary);
  flex-shrink: 0;
  transition: background 0.15s;
}

.app-header__back:hover {
  background: rgba(45, 1, 2, 0.04);
}

.app-header__text {
  flex: 1;
  min-width: 0;
}

.app-header__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
  line-height: 1;
}

.app-header__subtitle {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 2px 0 0;
  line-height: 1.3;
}

.app-header__action {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.app-header__action :deep(button) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(45, 1, 2, 0.04);
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.app-header__action :deep(button:hover) {
  background: rgba(45, 1, 2, 0.08);
}
</style>
