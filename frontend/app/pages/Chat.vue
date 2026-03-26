<template>
  <div class="chat">
    <!-- Header -->
    <header class="chat__header">
      <button class="chat__header-btn" @click="goBack">
        <LucideArrowLeft :size="20" />
      </button>
      <div class="chat__header-info">
        <div class="chat__header-avatar">
          <img src="/logo.png" alt="Pact AI" class="chat__header-avatar-img" />
        </div>
        <div>
          <h1 class="chat__header-name">Pact AI</h1>
          <span class="chat__header-status">
            <span class="chat__header-dot" />
            Online
          </span>
        </div>
      </div>
      <button class="chat__header-btn" @click="showOptions = true">
        <LucideEllipsisVertical :size="20" />
      </button>
    </header>

    <!-- Messages area -->
    <div ref="messagesRef" class="chat__messages">
      <!-- Loading history -->
      <SkeletonChatHistory v-if="isRestoringChat" />
      <!-- Welcome state (only when no existing chat) -->
      <div v-else-if="showWelcome" class="chat__welcome">
        <div class="chat__welcome-icon">
          <img src="/logo.png" alt="Pact AI" class="chat__welcome-logo" />
        </div>
        <ClientOnly>
          <h2 class="chat__welcome-title">
            Hi {{ firstName }}, how can I help?
          </h2>
          <template #fallback>
            <h2 class="chat__welcome-title">How can I help?</h2>
          </template>
        </ClientOnly>
        <p class="chat__welcome-desc">
          Describe your agreement, paste a conversation, or upload screenshots
          and I'll draft a contract for you.
        </p>

        <div class="chat__suggestions">
          <button
            v-for="s in suggestions"
            :key="s.text"
            class="chat__suggestion"
            @click="sendSuggestion(s.text)"
          >
            <component :is="s.icon" :size="16" />
            <span>{{ s.label }}</span>
          </button>
        </div>
      </div>

      <!-- Message list -->
      <template v-for="(msg, i) in uiMessages" :key="i">
        <ChatBubbleUser
          v-if="msg.role === 'user'"
          :text="msg.text"
          :images="msg.images"
          :time="msg.time"
        />
        <ChatBubbleAi
          v-else
          :text="msg.text"
          :typing="msg.typing"
          :contract="msg.contract"
          :time="msg.time"
          @view-contract="viewContract"
        />
      </template>
    </div>

    <!-- Image previews before sending -->
    <Transition name="preview-slide">
      <div v-if="pendingImages.length" class="chat__previews">
        <div class="chat__previews-scroll">
          <div
            v-for="(img, index) in pendingImages"
            :key="img.id"
            class="chat__preview"
          >
            <img :src="img.url" alt="" class="chat__preview-img" />
            <button
              class="chat__preview-remove"
              @click="removePendingImage(index)"
            >
              <LucideX :size="12" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Input bar -->
    <div class="chat__input-bar">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        class="chat__file-hidden"
        @change="handleFileSelect"
      />

      <button
        class="chat__input-action"
        aria-label="Attach image"
        @click="fileInputRef?.click()"
      >
        <LucideImagePlus :size="22" />
      </button>

      <div class="chat__input-wrap">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="chat__input"
          placeholder="Describe your agreement..."
          rows="1"
          @input="autoResize"
          @keydown.enter.exact.prevent="handleSend"
        />
      </div>

      <button
        class="chat__send"
        :class="{ 'chat__send--active': canSend }"
        :disabled="!canSend"
        aria-label="Send"
        @click="handleSend"
      >
        <LucideArrowUp :size="20" :stroke-width="2.5" />
      </button>
    </div>

    <!-- Options slider -->
    <BottomSlider v-model="showOptions" title="Options">
      <div class="chat__options">
        <button class="chat__option" @click="handleNewChat">
          <LucideMessageSquarePlus :size="20" />
          <span>New chat</span>
        </button>
        <button
          class="chat__option"
          @click="
            navigateTo('/History');
            showOptions = false;
          "
        >
          <LucideHistory :size="20" />
          <span>Chat history</span>
        </button>
        <button
          v-if="contractId"
          class="chat__option"
          @click="
            navigateTo(`/contracts/${contractId}`);
            showOptions = false;
          "
        >
          <LucideFileCheck :size="20" />
          <span>Contract status</span>
        </button>
        <button
          class="chat__option chat__option--danger"
          @click="handleClearChat"
        >
          <LucideTrash2 :size="20" />
          <span>Clear chat</span>
        </button>
      </div>
    </BottomSlider>
  </div>
</template>

<script setup lang="ts">
import {
  LucideArrowLeft,
  LucideArrowUp,
  LucideEllipsisVertical,
  LucideImagePlus,
  LucideX,
  LucideClipboardPaste,
  LucidePenLine,
  LucideCamera,
  LucideMessageSquarePlus,
  LucideHistory,
  LucideTrash2,
  LucideFileCheck,
} from "lucide-vue-next";
import type { ContractCard } from "~/components/Chat/BubbleAi.vue";
import type { Contract } from "~/utils/types/api";
import { useQueryClient } from "@tanstack/vue-query";
import {
  useSendChatMessage,
  useChatMessagesQuery,
  useCreateContract,
  useContractQuery,
} from "~/composables/useRequest";

definePageMeta({ layout: false });

useSeoMeta({
  title: "Chat",
  description:
    "Chat with Pact AI to create legally binding contracts from conversations, descriptions, or screenshots.",
});

// ── Types ──────────────────────────────────────────────────────────────────

interface PendingImage {
  id: string;
  file: File;
  url: string;
}

interface UiChatMessage {
  role: "user" | "ai";
  text?: string;
  images?: string[];
  typing?: boolean;
  contract?: ContractCard;
  time?: string;
}

// ── State ──────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const { addToast } = useToast();
const { uploadImages } = useUploadImage();
const { user } = useAuth();

const firstName = computed(
  () => user.value?.user_metadata?.first_name || "there",
);

const localMessages = ref<UiChatMessage[]>([]);
const inputText = ref("");
const pendingImages = ref<PendingImage[]>([]);
const messagesRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const showOptions = ref(false);
const isSending = ref(false);
const contractId = ref<string | null>((route.query.id as string) ?? null);

// ── API hooks ──────────────────────────────────────────────────────────────

const qc = useQueryClient();
const sendChatMutation = useSendChatMessage();
const createContractMutation = useCreateContract();
const { data: messagesData, isLoading: isLoadingHistory } =
  useChatMessagesQuery(contractId);
const { data: contractData, refetch: refetchContract } =
  useContractQuery(contractId);

const isRestoringChat = computed(
  () =>
    !!contractId.value &&
    (isLoadingHistory.value || !messagesData.value) &&
    !uiMessages.value.length,
);
const showWelcome = computed(
  () => !contractId.value && !uiMessages.value.length,
);

// ── Suggestions ────────────────────────────────────────────────────────────

const suggestions = [
  {
    icon: LucideClipboardPaste,
    label: "Paste a conversation",
    text: "I want to paste a chat conversation to turn into a contract.",
  },
  {
    icon: LucidePenLine,
    label: "Describe an agreement",
    text: "I want to describe an agreement in my own words.",
  },
  {
    icon: LucideCamera,
    label: "Upload screenshots",
    text: "I have screenshots of a conversation to upload.",
  },
];

// ── Computed ───────────────────────────────────────────────────────────────

const canSend = computed(
  () =>
    !isSending.value &&
    (inputText.value.trim().length > 0 || pendingImages.value.length > 0),
);

// ── Helpers ────────────────────────────────────────────────────────────────

const formatTime = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
};

const inferInputType = (
  text: string,
  hasImages: boolean,
): "paste" | "screenshot" | "manual" => {
  if (hasImages) return "screenshot";
  if (text.length > 300) return "paste";
  return "manual";
};

// ── Build contract card ───────────────────────────────────────────────────

const buildContractCard = (contract: Contract): ContractCard => {
  const parties = [contract.service_provider?.name, contract.client?.name]
    .filter(Boolean)
    .join(" ↔ ");
  return {
    id: contract.id,
    title: contract.title || "Untitled Contract",
    parties: parties || undefined,
  };
};

// ── Messages (derived) ────────────────────────────────────────────────────

const restoredMessages = computed<UiChatMessage[]>(() => {
  const res = messagesData.value;
  if (!res?.messages?.length) return [];

  const msgs: UiChatMessage[] = res.messages.map(
    (m): UiChatMessage => ({
      role: m.role === "ai" ? "ai" : "user",
      text: m.text,
      images: m.images?.length ? m.images : undefined,
      time: formatTime(m.created_at),
    }),
  );

  const readyMsg = res.messages.find((m) => m.metadata?.ready);
  if (readyMsg && contractId.value) {
    const contract =
      qc.getQueryData<Contract>(["contract", contractId.value]) ??
      contractData.value;
    if (contract) {
      msgs.push({
        role: "ai",
        contract: buildContractCard(contract),
        time: formatTime(readyMsg.created_at),
      });
    }
  }

  return msgs;
});

const uiMessages = computed<UiChatMessage[]>(
  () => localMessages.value.length ? localMessages.value : restoredMessages.value,
);

watch(uiMessages, () => scrollToBottom(), { flush: "post" });
onMounted(() => scrollToBottom());
// ── Core send logic ────────────────────────────────────────────────────────

const sendSuggestion = (text: string) => {
  inputText.value = text;
  handleSend();
};

const handleSend = async () => {
  if (!canSend.value) return;

  if (!localMessages.value.length && restoredMessages.value.length) {
    localMessages.value = [...restoredMessages.value];
  }

  const text = inputText.value.trim();
  const hasImages = pendingImages.value.length > 0;
  const localImageUrls = pendingImages.value.map((img) => img.url);
  const filesToUpload = pendingImages.value.map((img) => img.file);

  const userMsg: UiChatMessage = {
    role: "user",
    time: formatTime(),
  };
  if (text) userMsg.text = text;
  if (localImageUrls.length) userMsg.images = localImageUrls;

  localMessages.value.push(userMsg);
  inputText.value = "";
  pendingImages.value = [];
  if (textareaRef.value) textareaRef.value.style.height = "auto";

  isSending.value = true;
  localMessages.value.push({ role: "ai", typing: true });

  try {
    let imageUrls: string[] = [];
    if (filesToUpload.length) {
      imageUrls = await uploadImages(filesToUpload);
    }

    if (!contractId.value) {
      const inputType = inferInputType(text, hasImages);
      const contract = await createContractMutation.mutateAsync({
        title: text.slice(0, 60) || "New Contract",
        raw_input: text || undefined,
        input_type: inputType,
        screenshot_url: imageUrls[0],
      });
      contractId.value = contract.id;
      router.replace({ query: { id: contract.id } });
    }

    const inputType = inferInputType(text, hasImages);
    const response = await sendChatMutation.mutateAsync({
      contract_id: contractId.value,
      content: text || undefined,
      image_urls: imageUrls,
      input_type: inputType,
    });

    removeTypingBubble();

    const aiMsg = response.messages?.[0];
    if (aiMsg) {
      localMessages.value.push({
        role: "ai",
        text: aiMsg.content,
        time: formatTime(aiMsg.created_at),
      });
    }

    if (response.ready && contractId.value) {
      const { data: fresh } = await refetchContract();
      if (fresh) {
        localMessages.value.push({
          role: "ai",
          contract: buildContractCard(fresh),
          time: formatTime(),
        });
      }
    }
  } catch {
    removeTypingBubble();
    addToast("error", "Failed to send message. Please try again.");
  } finally {
    isSending.value = false;
  }
};

const removeTypingBubble = () => {
  const idx = localMessages.value.findIndex((m) => m.typing);
  if (idx !== -1) localMessages.value.splice(idx, 1);
};

const viewContract = (id: string) => {
  router.push(`/contracts/${id}`);
};

// ── File handling ──────────────────────────────────────────────────────────

const MAX_IMAGES = 5;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const processFiles = async (files: File[]) => {
  const remaining = MAX_IMAGES - pendingImages.value.length;
  if (remaining <= 0) {
    addToast("warning", `Maximum of ${MAX_IMAGES} images allowed.`);
    return;
  }

  const valid = files.filter((f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      addToast("error", `"${f.name}" is not supported. Use PNG, JPG, or WebP.`);
      return false;
    }
    return true;
  });

  const batch = valid.slice(0, remaining);
  if (batch.length < valid.length) {
    addToast(
      "warning",
      `Only ${remaining} more image${remaining === 1 ? "" : "s"} allowed (max ${MAX_IMAGES}).`,
    );
  }

  for (const file of batch) {
    let processed = file;
    if (file.size > MAX_FILE_SIZE) {
      try {
        const { compressImage } = await import("~/utils/compressImage");
        processed = await compressImage(file, 4);
      } catch {
        addToast(
          "error",
          `Failed to compress "${file.name}". Try a smaller image.`,
        );
        continue;
      }
    }
    const url = URL.createObjectURL(processed);
    pendingImages.value.push({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: processed,
      url,
    });
  }
};

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) {
    const files = Array.from(target.files);
    target.value = "";
    await processFiles(files);
  }
};

const removePendingImage = (index: number) => {
  const img = pendingImages.value[index];
  if (img) URL.revokeObjectURL(img.url);
  pendingImages.value.splice(index, 1);
};

// ── Options actions ────────────────────────────────────────────────────────

const handleNewChat = () => {
  localMessages.value = [];
  pendingImages.value = [];
  inputText.value = "";
  contractId.value = null;
  router.replace({ query: {} });
  showOptions.value = false;
};

const handleClearChat = () => {
  handleNewChat();
  addToast("info", "Chat cleared.");
};

onUnmounted(() => {
  pendingImages.value.forEach((img) => URL.revokeObjectURL(img.url));
});
</script>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 560px;
  margin: 0 auto;
  background: var(--color-white);
}

/* Header */
.chat__header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(45, 1, 2, 0.06);
  background: var(--color-white);
  flex-shrink: 0;
  z-index: 10;
}

.chat__header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: none;
  border: none;
  color: var(--color-primary);
  transition: background 0.15s;
}

.chat__header-btn:hover {
  background: rgba(45, 1, 2, 0.04);
}

.chat__header-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat__header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat__header-avatar-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.chat__header-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
  line-height: 1.2;
}

.chat__header-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #16a34a;
  font-weight: 500;
}

.chat__header-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16a34a;
}

/* Messages area */
.chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Welcome state */
.chat__welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 12px 20px;
  margin: auto 0;
}

.chat__welcome-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.chat__welcome-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.chat__welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px;
}

.chat__welcome-desc {
  font-size: 14px;
  color: var(--color-gray-dark);
  margin: 0 0 28px;
  max-width: 300px;
  line-height: 1.5;
}

.chat__suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 320px;
}

.chat__suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(45, 1, 2, 0.08);
  background: var(--color-white);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.chat__suggestion:hover {
  border-color: var(--color-primary);
  background: rgba(45, 1, 2, 0.02);
}

.chat__suggestion:active {
  transform: scale(0.98);
}

/* Image previews strip */
.chat__previews {
  padding: 8px 16px;
  border-top: 1px solid rgba(45, 1, 2, 0.06);
  background: var(--color-white);
  flex-shrink: 0;
}

.chat__previews-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.chat__preview {
  position: relative;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid rgba(45, 1, 2, 0.1);
}

.chat__preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.chat__preview-remove {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: var(--color-white);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s;
}

.chat__preview-remove:hover {
  background: var(--color-accent);
}

/* Preview slide transition */
.preview-slide-enter-active,
.preview-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.preview-slide-enter-from,
.preview-slide-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
}

.preview-slide-enter-to,
.preview-slide-leave-from {
  max-height: 100px;
  opacity: 1;
}

/* Input bar */
.chat__input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px calc(10px + var(--bottom));
  border-top: 1px solid rgba(45, 1, 2, 0.06);
  background: var(--color-white);
  flex-shrink: 0;
}

.chat__file-hidden {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.chat__input-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-gray-dark);
  flex-shrink: 0;
  transition:
    color 0.15s,
    background 0.15s;
}

.chat__input-action:hover {
  color: var(--color-primary);
  background: rgba(45, 1, 2, 0.04);
}

.chat__input-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  border: 1.5px solid rgba(45, 1, 2, 0.1);
  border-radius: 22px;
  padding: 4px 16px;
  transition: border-color 0.2s;
  background: rgba(45, 1, 2, 0.02);
}

.chat__input-wrap:focus-within {
  border-color: var(--color-primary);
  background: var(--color-white);
}

.chat__input {
  width: 100%;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 400;
  color: var(--color-primary);
  background: transparent;
  resize: none;
  line-height: 1.4;
  padding: 8px 0;
  max-height: 120px;
}

.chat__input::placeholder {
  color: var(--color-gray-medium);
}

.chat__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-gray-light);
  color: var(--color-white);
  border: none;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.chat__send--active {
  background: var(--color-primary);
  box-shadow: 0 2px 8px rgba(45, 1, 2, 0.25);
}

.chat__send--active:hover {
  transform: scale(1.05);
}

.chat__send--active:active {
  transform: scale(0.93);
}

.chat__send:disabled {
  cursor: default;
}

/* Options slider */
.chat__options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.chat__option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.chat__option:hover {
  background: rgba(45, 1, 2, 0.04);
}

.chat__option--danger {
  color: var(--color-accent);
}

@media (min-width: 768px) {
  .chat__header {
    padding: 14px 20px;
  }

  .chat__messages {
    padding: 24px 20px;
  }

  .chat__input-bar {
    padding: 12px 20px calc(12px + var(--bottom));
  }

  .chat__welcome-title {
    font-size: 26px;
  }
}
</style>
