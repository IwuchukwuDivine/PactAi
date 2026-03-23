<template>
  <nav class="bottom-tab">
    <!-- Left tabs -->
    <NuxtLink
      v-for="tab in leftTabs"
      :key="tab.path"
      :to="tab.path"
      class="bottom-tab__item"
      :class="{ 'bottom-tab__item--active': isActive(tab.path) }"
    >
      <component :is="tab.icon" :size="22" :stroke-width="isActive(tab.path) ? 2.4 : 1.6" />
      <span class="bottom-tab__label">{{ tab.name }}</span>
    </NuxtLink>

    <!-- Center create button -->
    <div class="bottom-tab__center">
      <NuxtLink to="/Create" class="bottom-tab__create" :class="{ 'bottom-tab__create--active': isActive('/Create') }">
        <LucidePlus :size="26" :stroke-width="2.5" />
      </NuxtLink>
    </div>

    <!-- Right tabs -->
    <NuxtLink
      v-for="tab in rightTabs"
      :key="tab.path"
      :to="tab.path"
      class="bottom-tab__item"
      :class="{ 'bottom-tab__item--active': isActive(tab.path) }"
    >
      <component :is="tab.icon" :size="22" :stroke-width="isActive(tab.path) ? 2.4 : 1.6" />
      <span class="bottom-tab__label">{{ tab.name }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import {
  LucideHome,
  LucidePlus,
  LucideFolderOpen,
  LucideClockArrowUp,
  LucideUser,
} from "lucide-vue-next";

defineOptions({ name: "BottomTabNav" });

const route = useRoute();

const leftTabs = [
  { name: "Home", icon: LucideHome, path: "/Home" },
  { name: "Contracts", icon: LucideFolderOpen, path: "/Contracts" },
];

const rightTabs = [
  { name: "Activity", icon: LucideClockArrowUp, path: "/Activity" },
  { name: "Profile", icon: LucideUser, path: "/Profile" },
];

const isActive = (path: string) => route.path === path;
</script>

<style scoped>
.bottom-tab {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 64px;
  background: var(--color-white);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: var(--bottom);
  z-index: 100;
}

.bottom-tab__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  height: 100%;
  text-decoration: none;
  color: var(--color-gray-medium);
  transition: color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.bottom-tab__item--active {
  color: var(--color-primary);
}

.bottom-tab__label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

/* Center create FAB */
.bottom-tab__center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  position: relative;
}

.bottom-tab__create {
  position: absolute;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-white);
  box-shadow: 0 6px 20px rgba(45, 1, 2, 0.35);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.bottom-tab__create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(45, 1, 2, 0.4);
}

.bottom-tab__create:active {
  transform: scale(0.92);
}

.bottom-tab__create--active {
  background: var(--color-primary);
}

@media (min-width: 768px) {
  .bottom-tab {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.06);
  }
}
</style>
