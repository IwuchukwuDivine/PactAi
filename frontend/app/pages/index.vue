<template>
  <div class="welcome">
    <div class="welcome__content">
      <div class="welcome__hero">
        <img src="/logo.png" alt="Pact AI" class="welcome__logo" />
        <h1 class="welcome__title">Welcome</h1>
        <p class="welcome__subtitle">
          Turn informal chats into legally binding contracts — in seconds.
        </p>
      </div>

      <div class="welcome__features">
        <div class="welcome__feature">
          <LucideShieldCheck :size="20" />
          <span>NDPR compliant</span>
        </div>
        <div class="welcome__feature">
          <LucideLock :size="20" />
          <span>Encrypted</span>
        </div>
        <div class="welcome__feature">
          <LucideClock :size="20" />
          <span>Timestamped</span>
        </div>
      </div>

      <div class="welcome__actions">
        <AppButton
          title="Create an account"
          variant="outline"
          block
          @click="navigateTo('/SignUp')"
        />
        <AppButton
          title="Sign in"
          variant="primary"
          block
          @click="navigateTo('/SignIn')"
        />
      </div>

      <button class="welcome__guest" @click="navigateTo('/Home')">
        Continue as a Guest
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });
</script>

<style scoped>
.welcome {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 40px 24px;
  background: var(--color-white);
}

.welcome__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
  gap: 40px;
}

.welcome__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.welcome__logo {
  width: 120px;
  height: auto;
  object-fit: contain;
  margin-bottom: 8px;
}

.welcome__title {
  font-size: 42px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
  line-height: 1;
}

.welcome__subtitle {
  font-size: 16px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
  line-height: 1.5;
  max-width: 280px;
}

.welcome__features {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.welcome__feature {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-gray-dark);
}

.welcome__feature svg {
  color: var(--color-primary);
}

.welcome__actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.welcome__guest {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-primary);
  background: none;
  border: none;
  text-decoration: underline;
  text-underline-offset: 4px;
  padding: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.welcome__guest:hover {
  opacity: 0.7;
}

@media (min-width: 768px) {
  .welcome__title {
    font-size: 52px;
  }

  .welcome__subtitle {
    font-size: 18px;
    max-width: 340px;
  }

  .welcome__logo {
    width: 140px;
  }
}
</style>
