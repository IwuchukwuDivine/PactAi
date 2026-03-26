import useAuth from "~/composables/useAuth";

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return;

  const { isLoggedIn } = useAuth();

  if (isLoggedIn.value) {
    return navigateTo("/Home");
  }
});
