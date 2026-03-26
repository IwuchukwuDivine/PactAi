<template>
  <div>
    <div class="auth-body__intro">
      <div class="auth-body__icon-wrap">
        <LucideKeyRound :size="32" />
      </div>
      <h1 class="auth-body__title">Forgot password?</h1>
      <p class="auth-body__hint">
        Enter your email and we'll send you a link to reset your password.
      </p>
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
      </div>

      <AppButton
        title="Send reset link"
        type="submit"
        variant="primary"
        block
        :disabled="!isFormValid"
        :loading="isSubmitting"
      />
    </InputForm>

    <p class="auth-switch">
      Remember your password?
      <NuxtLink to="/SignIn" class="auth-switch__link">Sign in</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { emailRules } from "~/utils/types/rules";

definePageMeta({ layout: "auth" });

useSeoMeta({
  title: "Reset Password",
  description:
    "Reset your Pact AI password. Enter your email to receive a password reset link.",
});

const form = reactive({
  email: "",
});

const isFormValid = ref(false);
const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  isSubmitting.value = true;
  try {
    // TODO: implement password reset API call
  } finally {
    isSubmitting.value = false;
  }
};
</script>
