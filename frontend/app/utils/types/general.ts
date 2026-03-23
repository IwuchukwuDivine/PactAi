import type { Ref } from "vue";

export type FormContext = {
  registerInput: (id: symbol, isValid: Ref<boolean>) => void;
  unregisterInput: (id: symbol) => void;
};
