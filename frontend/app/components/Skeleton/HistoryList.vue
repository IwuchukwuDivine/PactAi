<template>
  <div class="sk-history">
    <div v-for="n in 5" :key="n" class="sk-history__item">
      <div class="sk sk--circle" style="width: 44px; height: 44px; flex-shrink: 0" />
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px">
        <div style="display: flex; justify-content: space-between; align-items: center">
          <div class="sk" :style="{ width: (55 + n * 5) + '%', height: '14px' }" />
          <div class="sk" style="width: 48px; height: 11px; flex-shrink: 0" />
        </div>
        <div class="sk" :style="{ width: (70 + n * 3) + '%', height: '12px' }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "SkeletonHistoryList" });
</script>

<style scoped>
.sk-history {
  display: flex;
  flex-direction: column;
}

.sk-history__item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
}
</style>
