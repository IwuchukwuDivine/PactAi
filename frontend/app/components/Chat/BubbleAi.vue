<template>
  <div class="bubble-ai">
    <div class="bubble-ai__avatar">
      <img src="/logo.png" alt="Pact AI" class="bubble-ai__avatar-img">
    </div>

    <div class="bubble-ai__body">
      <div class="bubble-ai__content" :class="{ 'bubble-ai__content--typing': typing }">
        <!-- Typing indicator -->
        <div v-if="typing" class="bubble-ai__typing">
          <span /><span /><span />
        </div>

        <!-- Contract card -->
        <div v-else-if="contract" class="bubble-ai__contract" @click="$emit('viewContract', contract.id)">
          <div class="bubble-ai__contract-badge">
            <LucideFileCheck :size="14" />
            <span>Contract generated</span>
          </div>
          <h4 class="bubble-ai__contract-title">{{ contract.title }}</h4>
          <p v-if="contract.parties" class="bubble-ai__contract-parties">{{ contract.parties }}</p>
          <div class="bubble-ai__contract-cta">
            <span>View & sign</span>
            <LucideArrowRight :size="14" />
          </div>
        </div>

        <!-- Text / markdown-like content -->
        <template v-else>
          <p v-if="text" class="bubble-ai__text">{{ text }}</p>
        </template>
      </div>
      <span v-if="time" class="bubble-ai__time">{{ time }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "ChatBubbleAi" });

export interface ContractCard {
  id: string;
  title: string;
  parties?: string;
}

defineProps<{
  text?: string;
  typing?: boolean;
  contract?: ContractCard;
  time?: string;
}>();

defineEmits<{
  viewContract: [id: string];
}>();
</script>

<style scoped>
.bubble-ai {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 88%;
}

.bubble-ai__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.06);
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bubble-ai__avatar-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.bubble-ai__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.bubble-ai__content {
  background: rgba(45, 1, 2, 0.04);
  border-radius: 20px 20px 20px 4px;
  overflow: hidden;
}

.bubble-ai__text {
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--color-primary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Typing indicator */
.bubble-ai__content--typing {
  padding: 16px 20px;
}

.bubble-ai__typing {
  display: flex;
  gap: 5px;
  align-items: center;
}

.bubble-ai__typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-gray-medium);
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.bubble-ai__typing span:nth-child(2) {
  animation-delay: 0.16s;
}

.bubble-ai__typing span:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* Contract card */
.bubble-ai__contract {
  padding: 16px;
  cursor: pointer;
  transition: background 0.15s;
  min-width: 240px;
}

.bubble-ai__contract:hover {
  background: rgba(45, 1, 2, 0.07);
}

.bubble-ai__contract-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  background: #f0fdf4;
  color: #16a34a;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}

.bubble-ai__contract-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 4px;
}

.bubble-ai__contract-parties {
  font-size: 13px;
  color: var(--color-gray-dark);
  margin: 0 0 12px;
}

.bubble-ai__contract-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-accent);
}

/* Time */
.bubble-ai__time {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-gray-muted);
  margin-top: 4px;
  padding-left: 4px;
}
</style>
