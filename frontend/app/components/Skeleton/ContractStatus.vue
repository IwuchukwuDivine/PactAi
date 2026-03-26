<template>
  <div class="sk-status">
    <!-- Card -->
    <div class="sk-status__card">
      <div class="sk-status__card-top">
        <div class="sk sk--rounded" style="width: 48px; height: 48px; flex-shrink: 0" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px">
          <div class="sk" style="width: 70%; height: 16px" />
          <div class="sk" style="width: 40%; height: 12px" />
        </div>
      </div>
      <div class="sk-status__parties">
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px">
          <div class="sk" style="width: 30px; height: 10px" />
          <div class="sk" style="width: 80%; height: 13px" />
        </div>
        <div class="sk sk--circle" style="width: 14px; height: 14px; flex-shrink: 0" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px">
          <div class="sk" style="width: 20px; height: 10px" />
          <div class="sk" style="width: 75%; height: 13px" />
        </div>
      </div>
      <div class="sk sk--pill" style="width: 100px; height: 26px" />
    </div>

    <!-- Progress -->
    <div class="sk-status__progress">
      <div class="sk sk--pill" style="width: 100%; height: 6px" />
      <div class="sk" style="width: 120px; height: 12px" />
    </div>

    <!-- Timeline -->
    <div class="sk-status__timeline">
      <div v-for="n in 4" :key="n" class="sk-status__step">
        <div class="sk sk--circle" style="width: 32px; height: 32px; flex-shrink: 0" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px">
          <div class="sk" style="width: 55%; height: 14px" />
          <div class="sk" style="width: 85%; height: 12px" />
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="sk-status__actions">
      <div v-for="n in 3" :key="n" class="sk sk--rounded" style="flex: 1; height: 68px" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "SkeletonContractStatus" });
</script>

<style scoped>
.sk-status {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sk-status__card {
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  border: 1.5px solid rgba(45, 1, 2, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sk-status__card-top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.sk-status__parties {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-off-white);
  border-radius: 12px;
}

.sk-status__progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sk-status__timeline {
  background: var(--color-white);
  border-radius: 18px;
  padding: 20px;
  border: 1.5px solid rgba(45, 1, 2, 0.06);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.sk-status__step {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.sk-status__actions {
  display: flex;
  gap: 10px;
}
</style>
