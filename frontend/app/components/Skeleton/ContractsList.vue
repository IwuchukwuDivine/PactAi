<template>
  <div class="sk-contracts">
    <div v-for="n in count" :key="n" class="sk-contracts__card">
      <div class="sk-contracts__top">
        <div class="sk sk--rounded" style="width: 42px; height: 42px; flex-shrink: 0" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px">
          <div class="sk" style="width: 65%; height: 14px" />
          <div class="sk" style="width: 40%; height: 11px" />
        </div>
        <div class="sk sk--pill" style="width: 64px; height: 22px; flex-shrink: 0" />
      </div>
      <div class="sk-contracts__bottom">
        <div class="sk" style="width: 50%; height: 11px" />
        <div class="sk" style="width: 30%; height: 11px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "SkeletonContractsList" });

withDefaults(defineProps<{ count?: number }>(), { count: 4 });
</script>

<style scoped>
.sk-contracts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sk-contracts__card {
  background: var(--color-white);
  border-radius: 16px;
  padding: 16px;
  border: 1.5px solid rgba(45, 1, 2, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sk-contracts__top {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sk-contracts__bottom {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(45, 1, 2, 0.04);
}
</style>
