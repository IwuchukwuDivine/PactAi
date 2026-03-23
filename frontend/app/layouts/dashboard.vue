<template>
  <div class="dashboard-layout">
    <main class="dashboard-layout__main">
      <slot />
    </main>
    <BottomTab />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "DashboardLayout" });
</script>

<style scoped>
.dashboard-layout {
  min-height: 100dvh;
  background: var(--color-white);
}

.dashboard-layout__main {
  padding-bottom: calc(68px + var(--bottom));
}
</style>
