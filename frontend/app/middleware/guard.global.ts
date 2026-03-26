import useAuth from "~/composables/useAuth";

const PUBLIC_PATHS = ["/", "/SignIn", "/SignUp", "/ForgotPassword"];

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const { isLoggedIn } = useAuth();

  const isPublic =
    PUBLIC_PATHS.includes(to.path) || to.path.startsWith("/sign/");

  if (!isLoggedIn.value && !isPublic) {
    return navigateTo("/");
  }
});
