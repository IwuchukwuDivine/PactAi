<template>
  <button
    :class="['app-btn', `app-btn--${variant}`, { 'app-btn--loading': loading, 'app-btn--block': block }]"
    :disabled="disabled || loading"
    :type="type"
    @click="onClick"
  >
    <span v-if="loading" class="app-btn__spinner" />
    <component :is="prependIcon" v-if="prependIcon && !loading" :size="iconSize" class="app-btn__icon" />
    <span v-if="title" class="app-btn__label">{{ title }}</span>
    <slot v-else />
    <component :is="appendIcon" v-if="appendIcon && !loading" :size="iconSize" class="app-btn__icon" />
  </button>
</template>

<script setup lang="ts">
import type { Component } from "vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    variant?: "primary" | "outline" | "secondary" | "ghost" | "danger";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    block?: boolean;
    prependIcon?: Component;
    appendIcon?: Component;
    iconSize?: number;
  }>(),
  {
    title: undefined,
    variant: "primary",
    type: "button",
    disabled: false,
    loading: false,
    block: false,
    prependIcon: undefined,
    appendIcon: undefined,
    iconSize: 18,
  },
);

const emit = defineEmits<{ click: [e: MouseEvent] }>();

const onClick = (e: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit("click", e);
  }
};
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 56px;
  padding: 0 28px;
  border-radius: 15px;
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 800;
  font-style: italic;
  letter-spacing: 0.4px;
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
  border: 3px solid transparent;
}

.app-btn--block {
  width: 100%;
}

.app-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Primary — filled dark */
.app-btn--primary {
  background: var(--color-primary);
  color: var(--color-off-white);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-default);
}

.app-btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.app-btn--primary:active:not(:disabled) {
  transform: scale(0.97);
}

/* Outline — bordered, transparent bg */
.app-btn--outline {
  background: var(--color-off-white);
  color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-default);
}

.app-btn--outline:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-off-white);
}

.app-btn--outline:active:not(:disabled) {
  transform: scale(0.97);
}

/* Secondary — soft gray */
.app-btn--secondary {
  background: var(--color-gray-light);
  color: var(--color-primary);
  border-color: var(--color-gray-light);
}

.app-btn--secondary:hover:not(:disabled) {
  background: var(--color-gray-medium);
  border-color: var(--color-gray-medium);
}

.app-btn--secondary:active:not(:disabled) {
  transform: scale(0.97);
}

/* Ghost — no bg, no border */
.app-btn--ghost {
  background: transparent;
  color: var(--color-primary);
  border-color: transparent;
  box-shadow: none;
}

.app-btn--ghost:hover:not(:disabled) {
  background: rgba(45, 1, 2, 0.06);
}

/* Danger — accent red */
.app-btn--danger {
  background: var(--color-accent);
  color: var(--color-white);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-default);
}

.app-btn--danger:hover:not(:disabled) {
  opacity: 0.9;
}

.app-btn--danger:active:not(:disabled) {
  transform: scale(0.97);
}

/* Loading spinner */
.app-btn--loading {
  pointer-events: none;
}

.app-btn__spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}

.app-btn__label {
  line-height: 1;
}

.app-btn__icon {
  flex-shrink: 0;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
