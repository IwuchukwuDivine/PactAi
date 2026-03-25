import { useAuthStore } from "~/store/auth";

export default () => {
  const authStore = useAuthStore();
  const { isLoggedIn, user } = storeToRefs(authStore);

  return {
    isLoggedIn,
    user,
  };
};
