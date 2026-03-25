export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const toasts = ref<Toast[]>([]);

const addToast = (
  type: Toast["type"],
  message: string,
  duration: number = 4000,
) => {
  if (toasts.value.some((t) => t.message === message)) return;

  const id =
    typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  if (toasts.value.length >= 3) {
    toasts.value.pop();
  }

  toasts.value.unshift({ id, type, message });

  setTimeout(() => {
    removeToast(id);
  }, duration);
};

const removeToast = (id: string) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) toasts.value.splice(index, 1);
};

export const useToast = () => ({
  toasts: readonly(toasts),
  addToast,
  removeToast,
});
