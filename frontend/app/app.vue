<template>
  <AppToast />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { initializeSupabase } = useSupabaseClient();

onMounted(async () => {
  await initializeSupabase();
});
</script>
