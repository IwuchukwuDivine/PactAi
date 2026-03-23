<template>
  <div class="auth-page">
    <header class="auth-header">
      <img src="/logo.png" alt="Pact AI" class="auth-header__logo">
    </header>

    <div class="auth-body">
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

      <div class="auth-badges">
        <div class="auth-badge">
          <LucideShieldCheck :size="14" />
          <span>NDPR compliant</span>
        </div>
        <div class="auth-badge">
          <LucideLock :size="14" />
          <span>Encrypted</span>
        </div>
        <div class="auth-badge">
          <LucideClock :size="14" />
          <span>Timestamped</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { emailRules, passwordRules } from "~/utils/types/rules";

definePageMeta({ layout: false });

const form = reactive({
  email: "",
  password: "",
});

const isFormValid = ref(false);
const isSubmitting = ref(false);

const handleGoogleSignIn = () => {
  // TODO: implement Google OAuth
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  isSubmitting.value = true;
  try {
    // TODO: implement sign-in API call
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
  justify-content: center;
  padding: 16px 24px;
  background: var(--color-primary);
}

.auth-header__logo {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.auth-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 32px 24px 40px;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  gap: 24px;
}

.auth-body__intro {
  text-align: center;
}

.auth-body__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-black);
  margin: 0 0 6px;
}

.auth-body__hint {
  font-size: 14px;
  color: var(--color-gray-dark);
  margin: 0;
}

.auth-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 56px;
  border-radius: 10px;
  border: 3px solid var(--color-gray-medium);
  background: var(--color-white);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-black);
  cursor: pointer;
  transition: border-color 0.2s;
}

.auth-google:hover {
  border-color: var(--color-primary);
}

.auth-google__icon {
  width: 22px;
  height: 22px;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.auth-divider::before,
.auth-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--color-gray-medium);
}

.auth-divider span {
  font-size: 13px;
  font-weight: 300;
  font-style: italic;
  color: var(--color-gray-dark);
  white-space: nowrap;
}

.auth-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  margin-bottom: 4px;
}

.auth-forgot {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 24px;
}

.auth-forgot__link {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-accent);
  text-decoration: none;
}

.auth-forgot__link:hover {
  text-decoration: underline;
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

.auth-badges {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 16px;
}

.auth-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-gray-dark);
}

.auth-badge svg {
  color: var(--color-primary);
}

@media (min-width: 768px) {
  .auth-header__logo {
    height: 56px;
  }

  .auth-body {
    padding-top: 48px;
    gap: 28px;
  }

  .auth-body__title {
    font-size: 26px;
  }
}
</style>
