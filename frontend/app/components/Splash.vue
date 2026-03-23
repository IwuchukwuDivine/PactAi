<template>
  <Transition name="splash-fade">
    <div v-if="visible" class="splash">
      <div class="splash__logo-wrap">
        <img src="/logo.png" alt="Pact AI" class="splash__logo">
      </div>
      <p class="splash__tagline">Protect your agreements</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineOptions({ name: "SplashScreen" });

const emit = defineEmits<{ done: [] }>();

const visible = ref(true);

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
    setTimeout(() => emit("done"), 400);
  }, 2400);
});
</script>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  gap: 24px;
}

.splash__logo-wrap {
  animation: pulse-glow 1.6s ease-in-out infinite;
}

.splash__logo {
  width: 140px;
  height: auto;
  object-fit: contain;
}

.splash__tagline {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-gray-dark);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin: 0;
  animation: fade-up 0.8s ease-out 0.4s both;
}

@keyframes pulse-glow {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
    filter: drop-shadow(0 0 0px rgba(45, 1, 2, 0));
  }
  50% {
    transform: scale(1.08);
    opacity: 0.85;
    filter: drop-shadow(0 0 20px rgba(45, 1, 2, 0.2));
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade-out transition */
.splash-fade-leave-active {
  transition: opacity 0.4s ease-out;
}

.splash-fade-leave-to {
  opacity: 0;
}
</style>
