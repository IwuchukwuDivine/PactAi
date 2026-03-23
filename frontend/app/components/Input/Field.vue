<template>
  <div class="input-field-wrapper" :class="orientation">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div
      class="input-container"
      :class="{
        'input-container--error': (error || validationError) && isTouched,
        'input-container--disabled': !editable,
      }"
    >
      <component
        :is="prependIcon"
        v-if="prependIcon"
        :size="18"
        class="input-icon"
      />
      <input
        v-bind="$attrs"
        class="input-element"
        :type="computedType"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="!editable"
        @input="onInput"
        @blur="onBlur"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="input-toggle"
        tabindex="-1"
        @click.stop="togglePasswordVisibility"
      >
        <LucideEyeOff v-if="isPasswordVisible" :size="20" />
        <LucideEye v-else :size="20" />
      </button>
      <component
        :is="appendIcon"
        v-else-if="appendIcon"
        :size="20"
        class="input-icon"
        @click.stop
      />
    </div>
    <p v-if="(error || validationError) && isTouched" class="input-error">
      {{ error || validationError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import type { Rule } from "~/utils/types/rules";
import type { FormContext } from "~/utils/types/general";

defineOptions({ inheritAttrs: false });

const emit = defineEmits(["update:modelValue", "update:valid"]);

const props = withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    modelValue: string | number;
    type?: string;
    editable?: boolean;
    prependIcon?: Component;
    appendIcon?: Component;
    orientation?: "vertical" | "horizontal";
    error?: string;
    rules?: Rule[];
  }>(),
  {
    label: undefined,
    placeholder: "Type here",
    type: "text",
    editable: true,
    prependIcon: undefined,
    appendIcon: undefined,
    orientation: "vertical",
    error: undefined,
    rules: undefined,
  },
);

const validationError = ref("");
const isPasswordVisible = ref(false);
const isValid = ref(true);
const isTouched = ref(false);

const formContext = inject<FormContext | null>("formContext", null);
const inputId = Symbol("input");

onMounted(() => {
  validate(props.modelValue);
  if (formContext) {
    formContext.registerInput(inputId, isValid);
  }
});

onUnmounted(() => {
  if (formContext) {
    formContext.unregisterInput(inputId);
  }
});

const computedType = computed(() => {
  if (props.type === "password") {
    return isPasswordVisible.value ? "text" : "password";
  }
  return props.type;
});

const togglePasswordVisibility = () => {
  if (props.type === "password") {
    isPasswordVisible.value = !isPasswordVisible.value;
  }
};

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let value: string | number = target.value;

  isTouched.value = true;

  if (props.type === "number" && value !== "") {
    const numValue = Number(value);
    value = isNaN(numValue) ? value : numValue;
  }

  emit("update:modelValue", value);
  validate(value);
};

const validate = (value: string | number) => {
  if (!props.rules || props.rules.length === 0) {
    isValid.value = true;
    emit("update:valid", true);
    return true;
  }

  validationError.value = "";
  for (const { rule, message } of props.rules) {
    if (!rule(value)) {
      validationError.value = message;
      isValid.value = false;
      emit("update:valid", false);
      return false;
    }
  }

  isValid.value = true;
  emit("update:valid", true);
  return true;
};

const onBlur = () => {
  isTouched.value = true;
  validate(props.modelValue);
};

watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (newValue === oldValue) return;
    validate(newValue);
  },
);
</script>

<style scoped>
.input-field-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
}

.input-field-wrapper.horizontal {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.input-field-wrapper.horizontal > .input-label {
  margin-bottom: 0;
  min-width: fit-content;
}

.input-field-wrapper.horizontal > .input-container {
  flex: 1;
}

.input-label {
  font-size: 20px;
  font-weight: 400;
  color: var(--color-black);
  line-height: 1.2;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 69px;
  padding: 0 20px;
  border-radius: 10px;
  border: 3px solid var(--color-gray-medium);
  background: var(--color-white);
  transition: border-color 0.2s ease;
}

.input-container:focus-within {
  border-color: var(--color-primary);
}

.input-container--error {
  border-color: var(--color-accent);
}

.input-container--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-gray-light);
}

.input-element {
  flex: 1;
  width: 100%;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-black);
  background: transparent;
}

.input-element::placeholder {
  color: var(--color-gray-dark);
}

.input-element:disabled {
  cursor: not-allowed;
}

.input-icon {
  flex-shrink: 0;
  color: var(--color-gray-dark);
}

.input-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-gray-dark);
  cursor: pointer;
}

.input-toggle:hover {
  color: var(--color-primary);
}

.input-error {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-accent);
  margin: 0;
  line-height: 1.3;
}
</style>
