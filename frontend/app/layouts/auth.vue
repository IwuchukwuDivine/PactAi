<template>
  <div class="auth-page">
    <header class="auth-header">
      <button v-if="showBack" class="auth-header__back" @click="goBack()">
        <LucideArrowLeft :size="22" />
      </button>
      <img src="/logo.png" alt="Pact AI" class="auth-header__logo">
      <span v-if="showBack" class="auth-header__spacer" />
    </header>

    <div class="auth-body">
      <slot />

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
import goBack from "~/utils/goBack";

defineOptions({ name: "AuthLayout" });

const route = useRoute();
const showBack = computed(() => route.path !== "/SignIn" && route.path !== "/SignUp");
</script>
