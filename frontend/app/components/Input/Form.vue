<template>
  <form @submit.prevent="handleSubmit">
    <slot />
  </form>
</template>

<script setup lang="ts">
import type { FormContext } from "~/utils/types/general";

const emit = defineEmits<{
  "update:modelValue": [valid: boolean];
  submit: [];
}>();

withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  {
    modelValue: false,
  },
);

const inputs = reactive<Map<symbol, Ref<boolean>>>(new Map());

const registerInput = (id: symbol, isValid: Ref<boolean>) => {
  inputs.set(id, isValid);
};

const unregisterInput = (id: symbol) => {
  inputs.delete(id);
};

provide<FormContext>("formContext", {
  registerInput,
  unregisterInput,
});

const isValid = computed(() => {
  if (inputs.size === 0) return true;
  return Array.from(inputs.values()).every((inputValid) => inputValid.value);
});

watch(
  isValid,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { immediate: true },
);

const handleSubmit = () => {
  if (isValid.value) {
    emit("submit");
  }
};

defineExpose({ isValid });
</script>

<style scoped>
form {
  width: 100%;
}
</style>
