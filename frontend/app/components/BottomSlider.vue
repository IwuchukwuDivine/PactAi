<template>
  <Teleport to="body">
    <Transition name="slider">
      <div v-if="modelValue" class="slider-overlay" @click="close">
        <div class="slider-content" @click.stop>
          <button class="slider-handle" aria-label="Close" @click="close">
            <span class="slider-handle__bar" />
          </button>

          <template v-if="title">
            <div class="slider-header">
              <h2 class="slider-header__title">{{ title }}</h2>
              <button class="slider-header__close" aria-label="Close" @click="close">
                <LucideX :size="20" :stroke-width="2.5" />
              </button>
            </div>
            <div class="slider-divider" />
          </template>

          <template v-else-if="modal">
            <div class="slider-modal">
              <div class="slider-modal__icon-wrap" :class="`slider-modal__icon-wrap--${modal.type}`">
                <component :is="modal.icon" :size="40" />
              </div>
              <h2 v-if="modal.title" class="slider-modal__title">{{ modal.title }}</h2>
              <p v-if="modal.subtitle" class="slider-modal__subtitle" :class="`slider-modal__subtitle--${modal.type}`">
                {{ modal.subtitle }}
              </p>
              <div class="slider-modal__actions">
                <AppButton
                  v-if="modal.secondaryActionTitle"
                  :title="modal.secondaryActionTitle"
                  variant="outline"
                  block
                  @click="modal.secondaryAction?.()"
                />
                <AppButton
                  :title="modal.primaryActionTitle"
                  variant="primary"
                  block
                  @click="modal.primaryAction?.()"
                />
              </div>
            </div>
          </template>

          <div class="slider-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Component } from "vue";

export interface SliderModal {
  type: "success" | "error" | "warning" | "info";
  icon: Component;
  title?: string;
  subtitle?: string;
  primaryActionTitle: string;
  primaryAction?: () => void;
  secondaryActionTitle?: string;
  secondaryAction?: () => void;
}

type Props = {
  modelValue: boolean;
} & (
  | { title?: string; modal?: never }
  | { modal?: SliderModal; title?: never }
);

defineOptions({ name: "BottomSliderPanel" });

const props = defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const close = () => emit("update:modelValue", false);

watch(
  () => props.modelValue,
  (open) => {
    if (import.meta.client) {
      document.body.style.overflow = open ? "hidden" : "";
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = "";
  }
});
</script>

<style scoped>
.slider-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.slider-content {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 90dvh;
  overflow-y: auto;
  background: var(--color-white);
  border-radius: 24px 24px 0 0;
  padding-bottom: calc(16px + var(--bottom));
}

/* Drag handle */
.slider-handle {
  display: flex;
  justify-content: center;
  padding: 14px 0 8px;
  width: 100%;
  background: none;
  border: none;
}

.slider-handle__bar {
  width: 48px;
  height: 4px;
  border-radius: 99px;
  background: var(--color-gray-light);
  display: block;
}

/* Header with title + close */
.slider-header {
  display: flex;
  align-items: center;
  padding: 0 20px 14px;
}

.slider-header__title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.slider-header__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-primary);
  transition: background 0.15s;
}

.slider-header__close:hover {
  background: rgba(45, 1, 2, 0.06);
}

.slider-divider {
  height: 1px;
  background: var(--color-gray-light);
  opacity: 0.6;
}

/* Modal layout */
.slider-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px 24px;
  text-align: center;
}

.slider-modal__icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.slider-modal__icon-wrap--success {
  background: #f0fdf4;
  color: #16a34a;
}

.slider-modal__icon-wrap--error {
  background: #fef2f2;
  color: var(--color-accent);
}

.slider-modal__icon-wrap--warning {
  background: #fffbeb;
  color: #d97706;
}

.slider-modal__icon-wrap--info {
  background: #faf5f5;
  color: var(--color-primary);
}

.slider-modal__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 6px;
  line-height: 1.3;
}

.slider-modal__subtitle {
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 28px;
  color: var(--color-gray-dark);
}

.slider-modal__subtitle--success {
  color: #16a34a;
}

.slider-modal__subtitle--error {
  color: var(--color-accent);
}

.slider-modal__subtitle--warning {
  color: #d97706;
}

.slider-modal__actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

/* Slot body */
.slider-body {
  padding: 0 20px;
}

/* Slide-up transition */
.slider-enter-active,
.slider-leave-active {
  transition: opacity 0.3s ease;
}

.slider-enter-active .slider-content,
.slider-leave-active .slider-content {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slider-enter-from,
.slider-leave-to {
  opacity: 0;
}

.slider-enter-from .slider-content,
.slider-leave-to .slider-content {
  transform: translateY(100%);
}
</style>
