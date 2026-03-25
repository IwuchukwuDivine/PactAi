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
      >
    </div>

    <!-- Chat list -->
    <div v-if="filteredChats.length" class="history__list">
      <template v-for="(group, gi) in groupedChats" :key="gi">
        <p class="history__date-label">{{ group.label }}</p>
        <button
          v-for="chat in group.chats"
          :key="chat.id"
          class="history__item"
          @click="navigateTo(`/Chat?id=${chat.id}`)"
        >
          <div class="history__item-avatar">
            <img src="/logo.png" alt="" class="history__item-avatar-img">
          </div>
          <div class="history__item-body">
            <div class="history__item-top">
              <span class="history__item-title">{{ chat.title }}</span>
              <span class="history__item-time">{{ chat.time }}</span>
            </div>
            <p class="history__item-preview">{{ chat.preview }}</p>
            <span
              v-if="chat.status"
              class="history__item-status"
              :class="`history__item-status--${chat.status}`"
            >
              {{ statusLabels[chat.status] }}
            </span>
          </div>
        </button>
      </template>
    </div>

    <!-- Empty state -->
    <div v-else class="history__empty">
      <div class="history__empty-icon">
        <LucideMessagesSquare :size="36" />
      </div>
      <p class="history__empty-title">
        {{ query ? "No results" : "No chats yet" }}
      </p>
      <p class="history__empty-desc">
        {{
          query
            ? "Try a different search term."
            : "Start a conversation with Pact AI to create your first contract."
        }}
      </p>
      <AppButton
        v-if="!query"
        title="Start chatting"
        variant="primary"
        :prepend-icon="LucideMessageSquarePlus"
        @click="navigateTo('/Chat')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LucideMessageSquarePlus,
  LucideSearch,
  LucideMessagesSquare,
} from "lucide-vue-next";

defineOptions({ name: "ChatHistoryPage" });
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Chat History",
  description: "View your past conversations with Pact AI and revisit generated contracts.",
});

interface ChatEntry {
  id: string;
  title: string;
  preview: string;
  time: string;
  date: string;
  status?: "draft" | "signed" | "pending" | "expired";
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  signed: "Signed",
  pending: "Pending signature",
  expired: "Expired",
};

const query = ref("");

// TODO: replace with API data
const chats = ref<ChatEntry[]>([
  {
    id: "1",
    title: "Logo Design Agreement",
    preview: "I need a contract for a freelance logo design project with TechWave...",
    time: "2:47 PM",
    date: "Today",
    status: "signed",
  },
  {
    id: "2",
    title: "Room Rental Agreement",
    preview: "My friend and I agreed that he'd rent my spare room for ₦150,000/month...",
    time: "11:30 AM",
    date: "Today",
    status: "pending",
  },
  {
    id: "3",
    title: "Freelance Dev Contract",
    preview: "I want to create a contract for a mobile app development project...",
    time: "Yesterday",
    date: "Yesterday",
    status: "draft",
  },
  {
    id: "4",
    title: "Catering Service Agreement",
    preview: "We agreed that she'd cater for my event on March 30th for ₦500,000...",
    time: "Mar 19",
    date: "Last week",
  },
]);

const filteredChats = computed(() => {
  if (!query.value.trim()) return chats.value;
  const q = query.value.toLowerCase();
  return chats.value.filter(
    (c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q),
  );
});

const groupedChats = computed(() => {
  const groups: { label: string; chats: ChatEntry[] }[] = [];
  const seen = new Set<string>();

  for (const chat of filteredChats.value) {
    if (!seen.has(chat.date)) {
      seen.add(chat.date);
      groups.push({ label: chat.date, chats: [] });
    }
    groups.find((g) => g.label === chat.date)?.chats.push(chat);
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
  transition: border-color 0.2s, background 0.2s;
}

.history__search-input::placeholder {
  color: var(--color-gray-medium);
}

.history__search-input:focus {
  border-color: var(--color-primary);
  background: var(--color-white);
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

.history__item-status--signed {
  background: #f0fdf4;
  color: #16a34a;
}

.history__item-status--pending {
  background: #fffbeb;
  color: #d97706;
}

.history__item-status--expired {
  background: rgba(170, 1, 1, 0.06);
  color: var(--color-accent);
}

/* Empty state */
.history__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
}

.history__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.04);
  color: var(--color-gray-medium);
  margin-bottom: 16px;
}

.history__empty-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-black);
  margin: 0 0 6px;
}

.history__empty-desc {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0 0 24px;
  max-width: 280px;
  line-height: 1.5;
}

@media (min-width: 768px) {
  .history {
    padding: 28px 24px 0;
  }

  .history__title {
    font-size: 28px;
  }
}
</style>
