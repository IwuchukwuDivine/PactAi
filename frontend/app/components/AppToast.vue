<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div" class="toast-stack">
      <div
        v-for="(toast, index) in toasts"
        :key="toast.id"
        class="toast-card"
        :class="[`toast-card--${toast.type}`, stackClass(index)]"
      >
        <div class="toast-accent" :class="`toast-accent--${toast.type}`" />
        <div class="toast-body">
          <component
            :is="iconMap[toast.type]"
            :size="18"
            :stroke-width="2.2"
            class="toast-icon"
          />
          <p class="toast-message">{{ toast.message }}</p>
          <button
            class="toast-close"
            aria-label="Dismiss"
            @click="removeToast(toast.id)"
          >
            <LucideX :size="14" :stroke-width="2.5" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideTriangleAlert,
  LucideInfo,
} from "lucide-vue-next";

defineOptions({ name: "AppToastPanel" });

const { toasts, removeToast } = useToast();

const iconMap = {
  success: LucideCircleCheck,
  error: LucideCircleX,
  warning: LucideTriangleAlert,
  info: LucideInfo,
} as const;

const stackClass = (index: number) => {
  if (index === 0) return "toast-stack-0";
  if (index === 1) return "toast-stack-1";
  if (index === 2) return "toast-stack-2";
  return "toast-stack-hidden";
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  z-index: 9999;
  top: 16px;
  left: 50%;
  width: min(400px, calc(100vw - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.toast-stack {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.toast-card {
  position: relative;
  display: flex;
  width: 100%;
  overflow: hidden;
  border-radius: 14px;
  pointer-events: auto;
  transform-origin: center top;
  transition:
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Stack positioning */
.toast-stack-0 {
  z-index: 30;
  transform: scale(1) translateY(0);
  opacity: 1;
}

.toast-stack-1 {
  z-index: 20;
  transform: scale(0.93) translateY(-25%);
  opacity: 0.85;
}

.toast-stack-2 {
  z-index: 10;
  transform: scale(0.86) translateY(-50%);
  opacity: 0.7;
}

.toast-stack-hidden {
  z-index: 0;
  transform: scale(0.75) translateY(-75%);
  opacity: 0;
  pointer-events: none;
}

/* Accent strip */
.toast-accent {
  width: 4px;
  flex-shrink: 0;
  border-radius: 4px 0 0 4px;
}

.toast-accent--success {
  background: #16a34a;
}

.toast-accent--error {
  background: var(--color-accent);
}

.toast-accent--warning {
  background: #d97706;
}

.toast-accent--info {
  background: var(--color-primary);
}

/* Card variants */
.toast-card--success {
  background: #f0fdf4;
  color: #14532d;
  box-shadow:
    0 4px 12px rgba(22, 163, 74, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.06);
}

.toast-card--error {
  background: #fef2f2;
  color: #450a0a;
  box-shadow:
    0 4px 12px rgba(170, 1, 1, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.06);
}

.toast-card--warning {
  background: #fffbeb;
  color: #451a03;
  box-shadow:
    0 4px 12px rgba(217, 119, 6, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.06);
}

.toast-card--info {
  background: #faf5f5;
  color: var(--color-primary);
  box-shadow:
    0 4px 12px rgba(45, 1, 2, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Body */
.toast-body {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 14px 14px 14px 12px;
}

.toast-icon {
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: none;
  opacity: 0.35;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    background 0.15s ease;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.06);
}

/* Transitions */
.toast-enter-active {
  transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  position: absolute;
  bottom: 0;
  z-index: -1;
  transition: all 280ms cubic-bezier(0.4, 0, 1, 1);
}

.toast-move {
  transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-30%) scale(0.9);
}
</style>
