import type { User } from "@supabase/supabase-js";

export const useAuthStore = defineStore(
  "app",
  () => {
    const isLoggedIn = ref(false);
    const user = ref<User | null>(null);

    /******************* Actions *******************/

    return {
      isLoggedIn,
      user,
    };
  },
  {
    persist: {
      storage: import.meta.client ? localStorage : undefined,
      omit: [],
    },
  },
);
