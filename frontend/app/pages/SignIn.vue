<template>
  <div>
    <div class="auth-body__intro">
      <h1 class="auth-body__title">Sign in</h1>
      <p class="auth-body__hint">
        PACT AI helps you to protect your agreements
      </p>
    </div>

    <button class="auth-google" @click="handleGoogleSignIn">
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        class="auth-google__icon"
      >
      <span>Continue with Google</span>
    </button>

    <div class="auth-divider">
      <span>Or continue with</span>
    </div>

    <InputForm v-model="isFormValid" @submit="handleSubmit">
      <div class="auth-fields">
        <InputField
          v-model="form.email"
          label="Email Address"
          placeholder="Enter your email address"
          type="email"
          :rules="emailRules"
        />
        <InputField
          v-model="form.password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          :rules="passwordRules"
        />
      </div>

      <div class="auth-forgot">
        <NuxtLink to="/ForgotPassword" class="auth-forgot__link">
          Forgot password?
        </NuxtLink>
      </div>

      <AppButton
        title="Sign in"
        type="submit"
        variant="primary"
        block
        :disabled="!isFormValid"
        :loading="isSubmitting"
      />
    </InputForm>

    <p class="auth-switch">
      Don't have an account?
      <NuxtLink to="/SignUp" class="auth-switch__link">Create one</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { emailRules, passwordRules } from "~/utils/types/rules";

definePageMeta({ layout: "auth", middleware: "auth" });

useSeoMeta({
  title: "Sign In",
  description:
    "Sign in to Pact AI to manage your contracts, escrow payments, and digital agreements.",
});

const form = reactive({
  email: "",
  password: "",
});

const isFormValid = ref(false);
const isSubmitting = ref(false);

const handleGoogleSignIn = () => {
  // TODO: implement Google OAuth
};

const { authenticateUser } = useSupabaseClient();

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  isSubmitting.value = true;
  try {
    const result = await authenticateUser(form.email, form.password, "login");
    if (result === "session") {
      navigateTo("/Home");
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>
