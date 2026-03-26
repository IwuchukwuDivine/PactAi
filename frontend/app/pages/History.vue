<template>
  <div class="history">
    <AppHeader title="Chats">
      <template #action>
        <button aria-label="New chat" @click="navigateTo('/Chat')">
          <LucideMessageSquarePlus :size="20" />
        </button>
      </template>
    </AppHeader>

    <!-- Search -->
    <div class="history__search">
      <LucideSearch :size="18" class="history__search-icon" />
      <input
        v-model="query"
        type="text"
        class="history__search-input"
        placeholder="Search chats..."
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !filteredChats.length" class="history__loading">
      <p>Loading chats...</p>
    </div>

    <!-- Chat list -->
    <div v-else-if="filteredChats.length" class="history__list">
      <template v-for="(group, gi) in groupedChats" :key="gi">
        <p class="history__date-label">{{ group.label }}</p>
        <button
          v-for="chat in group.chats"
          :key="chat.id"
          class="history__item"
          @click="navigateTo(`/Chat?id=${chat.id}`)"
        >
          <div class="history__item-avatar">
            <img src="/logo.png" alt="" class="history__item-avatar-img" />
          </div>
          <div class="history__item-body">
            <div class="history__item-top">
              <span class="history__item-title">{{ chat.title }}</span>
              <span class="history__item-time">{{
                formatChatTime(chat.time)
              }}</span>
            </div>
            <p class="history__item-preview">{{ chat.preview }}</p>
            <span
              v-if="chat.status"
              class="history__item-status"
              :class="`history__item-status--${chat.status}`"
            >
              {{ statusLabels[chat.status] || chat.status }}
            </span>
          </div>
        </button>
      </template>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else
      :icon="query ? LucideSearch : LucideMessagesSquare"
      :title="query ? 'No results' : 'No chats yet'"
      :description="
        query
          ? 'Try a different search term.'
          : 'Start a conversation with Pact AI to create your first contract.'
      "
    >
      <template v-if="!query" #action>
        <AppButton
          title="Start chatting"
          variant="primary"
          :prepend-icon="LucideMessageSquarePlus"
          @click="navigateTo('/Chat')"
        />
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import {
  LucideMessageSquarePlus,
  LucideSearch,
  LucideMessagesSquare,
} from "lucide-vue-next";
import type { ChatHistoryItem } from "~/utils/types/api";
import { useChatHistoryQuery } from "~/composables/useRequest";

defineOptions({ name: "ChatHistoryPage" });
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Chat History",
  description:
    "View your past conversations with Pact AI and revisit generated contracts.",
});

const statusLabels: Record<string, string> = {
  draft: "Draft",
  signed: "Signed",
  pending_signatures: "Pending signature",
  pending: "Pending signature",
  expired: "Expired",
  completed: "Completed",
  negotiating: "Under review",
};

const query = ref("");
const { data: historyData, isLoading } = useChatHistoryQuery();

const chats = computed<ChatHistoryItem[]>(() => historyData.value?.chats ?? []);

const filteredChats = computed(() => {
  if (!query.value.trim()) return chats.value;
  const q = query.value.toLowerCase();
  return chats.value.filter(
    (c) =>
      c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q),
  );
});

const formatChatTime = (isoStr: string) => {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "Last week";
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
};

const groupedChats = computed(() => {
  const groups: { label: string; chats: ChatHistoryItem[] }[] = [];
  const seen = new Set<string>();

  for (const chat of filteredChats.value) {
    const label = getDateLabel(chat.date || chat.time);
    if (!seen.has(label)) {
      seen.add(label);
      groups.push({ label, chats: [] });
    }
    groups.find((g) => g.label === label)?.chats.push(chat);
  }

  return groups;
});
</script>

<style scoped>
.history {
  padding: 20px 20px 0;
  max-width: 560px;
  margin: 0 auto;
}

/* Search */
.history__search {
  position: relative;
  margin-bottom: 20px;
}

.history__search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-medium);
  pointer-events: none;
}

.history__search-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1.5px solid rgba(45, 1, 2, 0.08);
  border-radius: 14px;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-primary);
  background: rgba(45, 1, 2, 0.02);
  transition:
    border-color 0.2s,
    background 0.2s;
}

.history__search-input::placeholder {
  color: var(--color-gray-medium);
}

.history__search-input:focus {
  border-color: var(--color-primary);
  background: var(--color-white);
}

/* Loading */
.history__loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
  color: var(--color-gray-dark);
  font-size: 14px;
}

/* List */
.history__list {
  display: flex;
  flex-direction: column;
}

.history__date-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-gray-dark);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 16px 0 8px;
  padding: 0 4px;
}

.history__date-label:first-child {
  margin-top: 0;
}

.history__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s;
  width: 100%;
}

.history__item:hover {
  background: rgba(45, 1, 2, 0.03);
}

.history__item:active {
  background: rgba(45, 1, 2, 0.06);
}

.history__item-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.history__item-avatar-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.history__item-body {
  flex: 1;
  min-width: 0;
}

.history__item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.history__item-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history__item-time {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-gray-muted);
  flex-shrink: 0;
}

.history__item-preview {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.history__item-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.history__item-status--draft {
  background: rgba(45, 1, 2, 0.06);
  color: var(--color-gray-dark);
}

.history__item-status--signed,
.history__item-status--completed {
  background: #f0fdf4;
  color: #16a34a;
}

.history__item-status--pending,
.history__item-status--pending_signatures,
.history__item-status--negotiating {
  background: #fffbeb;
  color: #d97706;
}

.history__item-status--expired,
.history__item-status--cancelled,
.history__item-status--disputed {
  background: rgba(170, 1, 1, 0.06);
  color: var(--color-accent);
}

@media (min-width: 768px) {
  .history {
    padding: 28px 24px 0;
  }
}
</style>
