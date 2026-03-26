<template>
  <AppToast />
  <Splash v-if="showSplash" @done="dismissSplash" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const SPLASH_KEY = "pact_splash_shown";

const showSplash = ref(false);
const { initializeSupabase } = useSupabaseClient();

onMounted(async () => {
  if (!sessionStorage.getItem(SPLASH_KEY)) {
    showSplash.value = true;
  }

  await initializeSupabase();
});

const dismissSplash = () => {
  showSplash.value = false;
  sessionStorage.setItem(SPLASH_KEY, "1");
};
</script>
