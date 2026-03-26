<template>
  <div>
    <div class="auth-body__intro">
      <h1 class="auth-body__title">Create an account</h1>
      <p class="auth-body__hint">
        PACT AI helps you to protect your agreements
      </p>
    </div>

    <button class="auth-google" @click="handleGoogleSignUp">
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
          v-model="form.firstName"
          label="First Name"
          placeholder="Enter your first name"
          type="text"
          :rules="requiredRules"
        />
        <InputField
          v-model="form.lastName"
          label="Last Name"
          placeholder="Enter your last name"
          type="text"
          :rules="requiredRules"
        />
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

      <AppButton
        title="Create account"
        type="submit"
        variant="primary"
        block
        :disabled="!isFormValid"
        :loading="isSubmitting"
      />
    </InputForm>

    <p class="auth-switch">
      Already have an account?
      <NuxtLink to="/SignIn" class="auth-switch__link">Sign in</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  emailRules,
  passwordRules,
  requiredRules,
} from "~/utils/types/rules";

definePageMeta({ layout: "auth", middleware: "auth" });

useSeoMeta({
  title: "Create Account",
  description:
    "Sign up for Pact AI to turn WhatsApp chats, DMs, and emails into legally enforceable contracts with built-in escrow.",
});

const form = reactive({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
});

const isFormValid = ref(false);
const isSubmitting = ref(false);

const handleGoogleSignUp = () => {
  // TODO: implement Google OAuth
};

const { authenticateUser } = useSupabaseClient();

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  isSubmitting.value = true;
  try {
    await authenticateUser(form.email, form.password, "signup", {
      first_name: form.firstName,
      last_name: form.lastName,
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
