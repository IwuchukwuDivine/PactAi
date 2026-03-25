import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { markRaw } from "vue";
import useAuth from "./useAuth";
import log from "~/utils/log";
import goTo from "~/utils/goTo";

let authStateListenerInitialized = false;
const supabase = shallowRef<SupabaseClient | null>(null);

export const useSupabaseClient = () => {
  const route = useRoute();
  const { addToast } = useToast();
  const { isLoggedIn, user } = useAuth();

  const initializeSupabase = async () => {
    if (supabase.value) return;
    const config = useRuntimeConfig();
    supabase.value = markRaw(
      createClient(
        config.public.supabaseUrl as string,
        config.public.supabaseAnonKey as string,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        },
      ),
    );

    // Set up auth state listener to handle token expiration and auto-logout
    if (!authStateListenerInitialized && supabase.value) {
      setupAuthStateListener();
      authStateListenerInitialized = true;
    }
    // await checkSession()
  };

  const setupAuthStateListener = () => {
    if (!supabase.value) return;
    supabase.value.auth.onAuthStateChange(async (event, session) => {
      log.info("Auth state changed:", event);
      switch (event) {
        case "SIGNED_IN":
          if (session?.user) setUser(session.user);
          break;
        case "TOKEN_REFRESHED":
          if (session?.user) setUser(session.user);
          break;
        case "SIGNED_OUT":
          setUser(null);
          if (route.path !== "/") {
            goTo("/");
          }
          break;
        case "USER_UPDATED":
          if (session?.user) setUser(session.user);
          break;
        default:
          break;
      }
    });
  };
  const authenticateUser = async (
    email: string,
    password: string,
    type: "login" | "signup",
    metadata?: { first_name?: string; last_name?: string },
  ) => {
    try {
      if (!supabase.value) await initializeSupabase();
      if (!supabase.value) throw new Error("Supabase client not initialized");
      if (type === "login") {
        const { data, error } = await supabase.value.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await handleAuth(data);
      } else if (type === "signup") {
        const { data, error } = await supabase.value.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        });
        if (error) throw error;
        await handleAuth(data);
      } else {
        throw new Error("Invalid type");
      }
    } catch (error: unknown) {
      log.error("Error authenticating user:", error);
      const message =
        error instanceof Error ? error.message : "Invalid email or password";
      addToast("error", message);
      setUser(null);
      return null;
    }
  };
  const handleAuth = async (data: {
    user: User | null;
    session: Session | null;
  }) => {
    console.log("data", data);
    if (data.user && data.session) {
      setUser(data.user);
      await nextTick();
      return;
    } else if (data.user && !data.session) {
      return;
    }
  };
  const setUser = (payload: User | null) => {
    if (payload) {
      user.value = payload;
      isLoggedIn.value = true;
    } else {
      user.value = null;
      isLoggedIn.value = false;
    }
  };
  const logoutUser = async () => {
    try {
      if (!supabase.value) await initializeSupabase();
      if (!supabase.value) throw new Error("Supabase client not initialized");
      const { error } = await supabase.value.auth.signOut();
      if (error) throw error;
      setUser(null);

      // Only redirect if we're not already on the login page
      if (route.path !== "/") {
        goTo("/");
      }
      return true;
    } catch (error: unknown) {
      log.error("Error logging out user:", error);
      // Even if signOut fails, clear local state
      setUser(null);
      const message =
        error instanceof Error ? error.message : "Failed to logout";
      addToast("error", message);
      return false;
    }
  };
  const verifyOtp = async (email: string, otp: string) => {
    try {
      if (!supabase.value) await initializeSupabase();
      if (!supabase.value) throw new Error("Supabase client not initialized");
      const { data, error } = await supabase.value.auth.verifyOtp({
        email: email,
        token: otp,
        type: "email",
      });
      if (error) {
        addToast("error", error.message || "Failed to verify OTP");
        throw error;
      }
      if (data.user && data.session) {
        await handleAuth(data);
      }
      return data;
    } catch (error: unknown) {
      log.error("Error verifying OTP:", error);
      const message =
        error instanceof Error ? error.message : "Failed to verify OTP";
      addToast("error", message);
      return false;
    }
  };
  const resendOtp = async (email: string) => {
    try {
      if (!supabase.value) await initializeSupabase();
      if (!supabase.value) throw new Error("Supabase client not initialized");
      const { data, error } = await supabase.value.auth.resend({
        email: email,
        type: "signup",
      });
      if (error) throw error;
      return data;
    } catch (error: unknown) {
      log.error("Error resending OTP:", error);
      const message =
        error instanceof Error ? error.message : "Failed to resend OTP";
      addToast("error", message);
      return false;
    }
  };

  return {
    supabase,
    initializeSupabase,
    authenticateUser,
    logoutUser,
    verifyOtp,
    resendOtp,
  };
};
