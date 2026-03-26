import type { User } from "@supabase/supabase-js";

export const useAuthStore = defineStore(
  "app",
  () => {
    const isLoggedIn = ref(false);
    const user = ref<User | null>(null);
    const showSplash = ref(true);

    /******************* Actions *******************/

    return {
      isLoggedIn,
      user,
      showSplash,
    };
  },
  {
    persist: {
      storage: import.meta.client ? localStorage : undefined,
    },
  },
);
