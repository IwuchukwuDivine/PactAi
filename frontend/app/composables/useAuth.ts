import { useAuthStore } from "~/store/auth";

export default () => {
  const authStore = useAuthStore();
  const { isLoggedIn, user, showSplash } = storeToRefs(authStore);

  return {
    isLoggedIn,
    user,
    showSplash,
  };
};
