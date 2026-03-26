<template>
  <div>
    <template v-if="emailSent">
      <div class="auth-body__intro">
        <div class="auth-body__icon-wrap">
          <LucideMailCheck :size="32" />
        </div>
        <h1 class="auth-body__title">Check your email</h1>
        <p class="auth-body__hint">
          We sent a confirmation link to <strong>{{ form.email }}</strong>.
          Click the link to activate your account.
        </p>
      </div>

      <AppButton
        title="Open Sign In"
        variant="primary"
        block
        @click="navigateTo('/SignIn')"
      />

      <p class="auth-switch">
        Didn't receive it?
        <button class="auth-switch__link" @click="handleResend">Resend email</button>
      </p>
    </template>

    <template v-else>
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
    </template>
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
const emailSent = ref(false);

const handleGoogleSignUp = () => {
  // TODO: implement Google OAuth
};

const { authenticateUser, resendOtp } = useSupabaseClient();
const { addToast } = useToast();

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  isSubmitting.value = true;
  try {
    const result = await authenticateUser(form.email, form.password, "signup", {
      first_name: form.firstName,
      last_name: form.lastName,
    });

    if (result === "confirm_email") {
      emailSent.value = true;
      addToast("success", "Check your email to confirm your account.");
    } else if (result === "session") {
      navigateTo("/Home");
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleResend = async () => {
  const result = await resendOtp(form.email);
  if (result) {
    addToast("success", "Confirmation email resent.");
  }
};
</script>
