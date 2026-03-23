<template>
  <div class="icon-component"></div>
</template>

<script setup lang="ts">
import type { IconName } from "~/utils/types/icons";

withDefaults(
  defineProps<{
    name: IconName;
    size?: number;
    color?: string;
  }>(),
  {
    size: 24,
    color: "currentColor",
  },
);
</script>
<style scoped>
.icon-component {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
