<template>
  <div class="bubble-user">
    <div class="bubble-user__content">
      <div v-if="images?.length" class="bubble-user__images" :class="imageGridClass">
        <div v-for="(img, i) in images" :key="i" class="bubble-user__img-wrap">
          <img :src="img" alt="" class="bubble-user__img">
        </div>
      </div>
      <p v-if="text" class="bubble-user__text">{{ text }}</p>
    </div>
    <span v-if="time" class="bubble-user__time">{{ time }}</span>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "ChatBubbleUser" });

const props = defineProps<{
  text?: string;
  images?: string[];
  time?: string;
}>();

const imageGridClass = computed(() => {
  const count = props.images?.length ?? 0;
  if (count === 1) return "bubble-user__images--single";
  if (count === 2) return "bubble-user__images--duo";
  return "bubble-user__images--grid";
});
</script>

<style scoped>
.bubble-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 82%;
  margin-left: auto;
}

.bubble-user__content {
  background: var(--color-primary);
  border-radius: 20px 20px 4px 20px;
  overflow: hidden;
}

.bubble-user__text {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--color-off-white);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-user__images + .bubble-user__text {
  padding-top: 8px;
}

/* Image layouts */
.bubble-user__images {
  display: grid;
  gap: 3px;
}

.bubble-user__images--single {
  grid-template-columns: 1fr;
}

.bubble-user__images--duo {
  grid-template-columns: 1fr 1fr;
}

.bubble-user__images--grid {
  grid-template-columns: 1fr 1fr;
}

.bubble-user__img-wrap {
  overflow: hidden;
}

.bubble-user__img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
}

.bubble-user__images--single .bubble-user__img {
  aspect-ratio: 16 / 10;
  max-height: 280px;
}

.bubble-user__time {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-gray-muted);
  margin-top: 4px;
  padding-right: 4px;
}
</style>
