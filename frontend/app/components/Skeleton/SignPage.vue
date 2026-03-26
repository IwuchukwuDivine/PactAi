<template>
  <div class="sk-sign">
    <!-- Card -->
    <div class="sk-sign__card">
      <div class="sk-sign__top">
        <div class="sk sk--rounded" style="width: 52px; height: 52px; flex-shrink: 0" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px">
          <div class="sk" style="width: 75%; height: 18px" />
          <div class="sk" style="width: 35%; height: 12px" />
        </div>
      </div>
      <div class="sk-sign__parties">
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px">
          <div class="sk" style="width: 30px; height: 10px" />
          <div class="sk" style="width: 80%; height: 14px" />
        </div>
        <div class="sk sk--circle" style="width: 16px; height: 16px; flex-shrink: 0" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px">
          <div class="sk" style="width: 20px; height: 10px" />
          <div class="sk" style="width: 70%; height: 14px" />
        </div>
      </div>
      <div class="sk sk--pill" style="width: 120px; height: 26px" />
    </div>

    <!-- Body -->
    <div class="sk-sign__body">
      <div class="sk" style="width: 50%; height: 16px; margin-bottom: 14px" />
      <div class="sk" style="width: 100%; height: 14px; margin-bottom: 8px" />
      <div class="sk" style="width: 95%; height: 14px; margin-bottom: 8px" />
      <div class="sk" style="width: 88%; height: 14px; margin-bottom: 8px" />
      <div class="sk" style="width: 70%; height: 14px; margin-bottom: 20px" />
      <div class="sk" style="width: 100%; height: 14px; margin-bottom: 8px" />
      <div class="sk" style="width: 92%; height: 14px; margin-bottom: 8px" />
      <div class="sk" style="width: 65%; height: 14px" />
    </div>

    <!-- Actions -->
    <div class="sk-sign__actions">
      <div class="sk sk--rounded" style="flex: 1; height: 48px" />
      <div class="sk sk--rounded" style="flex: 1; height: 48px" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "SkeletonSignPage" });
</script>

<style scoped>
.sk-sign {
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sk-sign__card {
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sk-sign__top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.sk-sign__parties {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-off-white);
  border-radius: 12px;
}

.sk-sign__body {
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.sk-sign__actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}
</style>
