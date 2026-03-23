<template>
  <div class="auth-page">
    <header class="auth-header">
      <button class="auth-header__back" @click="navigateTo('/SignIn')">
        <LucideArrowLeft :size="22" />
      </button>
      <img src="/logo.png" alt="Pact AI" class="auth-header__logo">
      <span class="auth-header__spacer" />
    </header>

    <div class="auth-body">
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
  </div>
</template>

<script setup lang="ts">
import { emailRules } from "~/utils/types/rules";

definePageMeta({ layout: false });

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

<style scoped>
.auth-page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--color-white);
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--color-primary);
}

.auth-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: var(--color-off-white);
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.auth-header__back:hover {
  background: rgba(255, 255, 255, 0.1);
}

.auth-header__logo {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.auth-header__spacer {
  width: 36px;
}

.auth-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 40px 24px;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  gap: 28px;
}

.auth-body__intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.auth-body__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.06);
  color: var(--color-primary);
  margin-bottom: 8px;
}

.auth-body__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-black);
  margin: 0;
}

.auth-body__hint {
  font-size: 14px;
  color: var(--color-gray-dark);
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

.auth-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  margin-bottom: 28px;
}

.auth-switch {
  font-size: 14px;
  color: var(--color-gray-dark);
  margin: 0;
}

.auth-switch__link {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
}

.auth-switch__link:hover {
  text-decoration: underline;
}

@media (min-width: 768px) {
  .auth-header__logo {
    height: 56px;
  }

  .auth-body {
    padding-top: 56px;
    gap: 32px;
  }

  .auth-body__title {
    font-size: 26px;
  }
}
</style>
