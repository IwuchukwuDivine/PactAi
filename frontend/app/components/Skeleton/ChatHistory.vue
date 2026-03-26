<template>
  <div class="sk-chat">
    <div class="sk-chat__row sk-chat__row--ai">
      <div class="sk-chat__avatar" />
      <div class="sk-chat__bubble sk-chat__bubble--ai">
        <div class="sk-chat__line" style="width: 85%" />
        <div class="sk-chat__line" style="width: 60%" />
      </div>
    </div>

    <div class="sk-chat__row sk-chat__row--user">
      <div class="sk-chat__bubble sk-chat__bubble--user">
        <div class="sk-chat__line sk-chat__line--light" style="width: 80%" />
        <div class="sk-chat__line sk-chat__line--light" style="width: 50%" />
      </div>
    </div>

    <div class="sk-chat__row sk-chat__row--ai">
      <div class="sk-chat__avatar" />
      <div class="sk-chat__bubble sk-chat__bubble--ai">
        <div class="sk-chat__line" style="width: 92%" />
        <div class="sk-chat__line" style="width: 75%" />
        <div class="sk-chat__line" style="width: 55%" />
      </div>
    </div>

    <div class="sk-chat__row sk-chat__row--user">
      <div class="sk-chat__bubble sk-chat__bubble--user">
        <div class="sk-chat__line sk-chat__line--light" style="width: 70%" />
      </div>
    </div>

    <div class="sk-chat__row sk-chat__row--ai">
      <div class="sk-chat__avatar" />
      <div class="sk-chat__bubble sk-chat__bubble--ai">
        <div class="sk-chat__line" style="width: 88%" />
        <div class="sk-chat__line" style="width: 62%" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "SkeletonChatHistory" });
</script>

<style scoped>
.sk-chat {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px 16px;
}

.sk-chat__row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.sk-chat__row--user {
  justify-content: flex-end;
}

.sk-chat__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.06);
  flex-shrink: 0;
  animation: skeleton-pulse 1.6s ease-in-out infinite;
}

.sk-chat__bubble {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  min-width: 140px;
  max-width: 70%;
}

.sk-chat__bubble--ai {
  background: rgba(45, 1, 2, 0.04);
  border-bottom-left-radius: 4px;
}

.sk-chat__bubble--user {
  background: rgba(45, 1, 2, 0.10);
  border-bottom-right-radius: 4px;
}

.sk-chat__line {
  height: 12px;
  border-radius: 6px;
  background: rgba(45, 1, 2, 0.08);
  animation: skeleton-pulse 1.6s ease-in-out infinite;
}

.sk-chat__line--light {
  background: rgba(45, 1, 2, 0.12);
}
</style>
