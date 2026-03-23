<template>
  <div class="error-page">
    <div class="error-content">
      <p class="error-code">{{ error?.statusCode || 500 }}</p>
      <h1 class="error-title">
        {{
          error?.statusCode === 404 ? "Page not found" : "Something went wrong"
        }}
      </h1>
      <p class="error-message">
        {{
          error?.statusCode === 404
            ? "The page you're looking for doesn't exist or has been moved."
            : "An unexpected error occurred. Please try again."
        }}
      </p>
      <div class="error-actions">
        <button class="btn-primary" @click="handleError">
          <LucideHome :size="18" />
          Back to Home
        </button>
        <button
          v-if="error?.statusCode !== 404"
          class="btn-secondary"
          @click="clearError({ redirect: $route.fullPath })"
        >
          <LucideRefreshCw :size="18" />
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError;
}>();

const handleError = () => clearError({ redirect: "/Home" });
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 24px;
  background: var(--color-white);
  font-family: var(--font-body);
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
  gap: 12px;
}

.error-code {
  font-size: 96px;
  font-weight: 900;
  font-style: italic;
  color: var(--color-primary);
  line-height: 1;
  margin: 0;
  letter-spacing: 2px;
}

.error-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-black);
  margin: 0;
  line-height: 1.2;
}

.error-message {
  font-size: 16px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  padding: 0 28px;
  border-radius: 15px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
  transition: opacity 0.2s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-off-white);
  border: 3px solid var(--color-primary);
  box-shadow: var(--shadow-default);
}

.btn-secondary {
  background: var(--color-off-white);
  color: var(--color-primary);
  border: 3px solid var(--color-primary);
  box-shadow: var(--shadow-default);
}

.btn-primary:hover,
.btn-secondary:hover {
  opacity: 0.85;
}
</style>
