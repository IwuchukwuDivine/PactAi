<template>
  <div class="escrow">
    <button class="escrow__toggle" @click="toggleEnabled">
      <div class="escrow__toggle-left">
        <div class="escrow__icon">
          <LucideLock :size="18" />
        </div>
        <div>
          <span class="escrow__label">Escrow protection</span>
          <span class="escrow__hint">Secure payment until delivery</span>
        </div>
      </div>
      <div class="escrow__switch" :class="{ 'escrow__switch--on': enabled }">
        <div class="escrow__switch-thumb" />
      </div>
    </button>

    <Transition name="escrow-expand">
      <div v-if="enabled" class="escrow__config">
        <div class="escrow__field">
          <label class="escrow__field-label">Amount</label>
          <div class="escrow__input-wrap">
            <span class="escrow__currency">₦</span>
            <input
              :value="amount"
              type="text"
              inputmode="numeric"
              class="escrow__input"
              placeholder="0.00"
              @input="onAmountInput"
            >
          </div>
        </div>

        <div class="escrow__field">
          <label class="escrow__field-label">Release condition</label>
          <div class="escrow__conditions">
            <button
              v-for="cond in conditions"
              :key="cond.id"
              class="escrow__cond"
              :class="{ 'escrow__cond--active': releaseCondition === cond.id }"
              @click="emit('update:releaseCondition', cond.id)"
            >
              <component :is="cond.icon" :size="16" />
              <span>{{ cond.label }}</span>
            </button>
          </div>
          <p class="escrow__cond-desc">{{ conditionDesc }}</p>
        </div>

        <div class="escrow__notice">
          <LucideShieldCheck :size="14" />
          <span>Funds are held securely and only released when conditions are met.</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  LucidePackageCheck,
  LucideThumbsUp,
  LucideCalendarClock,
} from "lucide-vue-next";

export type ReleaseCondition = "delivery" | "approval" | "timed";

defineOptions({ name: "EscrowConfigPanel" });

const props = withDefaults(
  defineProps<{
    enabled: boolean;
    amount: string;
    releaseCondition: ReleaseCondition;
  }>(),
  {
    enabled: false,
    amount: "",
    releaseCondition: "delivery",
  },
);

const emit = defineEmits<{
  "update:enabled": [value: boolean];
  "update:amount": [value: string];
  "update:releaseCondition": [value: ReleaseCondition];
}>();

const conditions = [
  { id: "delivery" as const, label: "On delivery", icon: LucidePackageCheck },
  { id: "approval" as const, label: "On approval", icon: LucideThumbsUp },
  { id: "timed" as const, label: "Time-based", icon: LucideCalendarClock },
];

const conditionDesc = computed(() => {
  const descs: Record<ReleaseCondition, string> = {
    delivery: "Funds release automatically when the deliverable is confirmed.",
    approval: "Funds release only after you manually approve the work.",
    timed: "Funds release after a set period if no dispute is raised.",
  };
  return descs[props.releaseCondition];
});

const toggleEnabled = () => emit("update:enabled", !props.enabled);

const onAmountInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/[^\d]/g, "");
  if (!raw) { emit("update:amount", ""); return; }
  emit("update:amount", Number(raw).toLocaleString("en-NG"));
};
</script>

<style scoped>
.escrow {
  border: 1.5px solid rgba(45, 1, 2, 0.08);
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-white);
}

.escrow__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 18px;
  background: none;
  border: none;
  cursor: pointer;
  gap: 14px;
}

.escrow__toggle-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.escrow__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #fffbeb;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.escrow__label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: left;
}

.escrow__hint {
  display: block;
  font-size: 12px;
  color: var(--color-gray-dark);
  text-align: left;
  margin-top: 1px;
}

/* Toggle switch */
.escrow__switch {
  width: 48px;
  height: 28px;
  border-radius: 99px;
  background: var(--color-gray-light);
  padding: 3px;
  flex-shrink: 0;
  transition: background 0.25s;
  cursor: pointer;
}

.escrow__switch--on {
  background: var(--color-primary);
}

.escrow__switch-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-white);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.escrow__switch--on .escrow__switch-thumb {
  transform: translateX(20px);
}

/* Config panel */
.escrow__config {
  padding: 0 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.escrow__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.escrow__field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.escrow__input-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid rgba(45, 1, 2, 0.12);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.escrow__input-wrap:focus-within {
  border-color: var(--color-primary);
}

.escrow__currency {
  padding: 0 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
}

.escrow__input {
  flex: 1;
  padding: 14px 14px 14px 6px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  background: transparent;
}

.escrow__input::placeholder {
  color: var(--color-gray-medium);
  font-weight: 400;
}

/* Release conditions */
.escrow__conditions {
  display: flex;
  gap: 8px;
}

.escrow__cond {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  padding: 10px 8px;
  border-radius: 10px;
  border: 1.5px solid rgba(45, 1, 2, 0.1);
  background: var(--color-white);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-gray-dark);
  cursor: pointer;
  transition: all 0.2s;
}

.escrow__cond--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.escrow__cond:not(.escrow__cond--active):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.escrow__cond-desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-gray-dark);
  margin: 0;
}

.escrow__notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f0fdf4;
  font-size: 12px;
  line-height: 1.4;
  color: #16a34a;
}

.escrow__notice svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Expand transition */
.escrow-expand-enter-active,
.escrow-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.escrow-expand-enter-from,
.escrow-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.escrow-expand-enter-to,
.escrow-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
