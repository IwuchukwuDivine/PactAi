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
      <!-- Welcome state -->
      <div v-if="!messages.length" class="chat__welcome">
        <div class="chat__welcome-icon">
          <img src="/logo.png" alt="Pact AI" class="chat__welcome-logo" />
        </div>
        <h2 class="chat__welcome-title">How can I help?</h2>
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
      <template v-for="(msg, i) in messages" :key="i">
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
import { compressImage } from "~/utils/compressImage";

definePageMeta({ layout: false });

useSeoMeta({
  title: "Chat",
  description:
    "Chat with Pact AI to create legally binding contracts from conversations, descriptions, or screenshots.",
});

interface PendingImage {
  id: string;
  file: File;
  url: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text?: string;
  images?: string[];
  typing?: boolean;
  contract?: ContractCard;
  time?: string;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_IMAGES = 5;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const { addToast } = useToast();
const router = useRouter();

const messages = ref<ChatMessage[]>([]);
const inputText = ref("");
const pendingImages = ref<PendingImage[]>([]);
const messagesRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const showOptions = ref(false);
const isProcessing = ref(false);

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

const canSend = computed(
  () =>
    !isProcessing.value &&
    (inputText.value.trim().length > 0 || pendingImages.value.length > 0),
);

const contractId = computed(() => {
  const contractMsg = [...messages.value].reverse().find((m) => m.contract);
  return contractMsg?.contract?.id ?? "e99e9e0";
});

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-NG", {
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

const sendSuggestion = (text: string) => {
  inputText.value = text;
  handleSend();
};

const handleSend = async () => {
  if (!canSend.value) return;

  const text = inputText.value.trim();
  const images = pendingImages.value.map((img) => img.url);

  const userMsg: ChatMessage = {
    role: "user",
    time: formatTime(),
  };
  if (text) userMsg.text = text;
  if (images.length) userMsg.images = images;

  messages.value.push(userMsg);
  inputText.value = "";
  pendingImages.value = [];

  if (textareaRef.value) {
    textareaRef.value.style.height = "auto";
  }

  scrollToBottom();

  isProcessing.value = true;
  messages.value.push({ role: "ai", typing: true });
  scrollToBottom();

  // TODO: replace with actual AI API call
  await new Promise((r) => setTimeout(r, 2000));

  const typingIdx = messages.value.findIndex((m) => m.typing);
  if (typingIdx !== -1) messages.value.splice(typingIdx, 1);

  const isContractRequest =
    text.toLowerCase().includes("contract") ||
    text.toLowerCase().includes("agreement") ||
    images.length > 0;

  if (
    isContractRequest &&
    messages.value.filter((m) => m.role === "user").length >= 2
  ) {
    messages.value.push({
      role: "ai",
      text: "I've reviewed the details and drafted your contract. Here it is:",
      time: formatTime(),
    });
    scrollToBottom();

    await new Promise((r) => setTimeout(r, 600));

    messages.value.push({
      role: "ai",
      contract: {
        id: "demo-contract-1",
        title: "Freelance Logo Design Agreement",
        parties: "Adewale Johnson ↔ Chioma Nwosu",
      },
      time: formatTime(),
    });
  } else {
    messages.value.push({
      role: "ai",
      text: getAiResponse(text),
      time: formatTime(),
    });
  }

  isProcessing.value = false;
  scrollToBottom();
};

const getAiResponse = (userText: string): string => {
  if (userText.toLowerCase().includes("paste")) {
    return "Go ahead and paste the conversation. I'll identify the parties, terms, and obligations to draft a proper contract.";
  }
  if (
    userText.toLowerCase().includes("describe") ||
    userText.toLowerCase().includes("agreement")
  ) {
    return "Tell me the details:\n\n• Who are the parties involved?\n• What's being agreed upon?\n• Any amounts, deadlines, or conditions?\n\nI'll structure it into a binding contract.";
  }
  if (
    userText.toLowerCase().includes("screenshot") ||
    userText.toLowerCase().includes("upload")
  ) {
    return "Upload your screenshots using the image button below. I'll extract the conversation and turn it into a contract.";
  }
  return "I understand. Could you share more details about the agreement? For example:\n\n• The parties involved\n• What's being exchanged or promised\n• Any timelines or payment amounts\n\nThe more context you provide, the better the contract.";
};

const viewContract = (id: string) => {
  router.push(`/contracts/${id}`);
};

// File handling (retained from Create.vue)
const processFiles = async (files: File[]) => {
  const remaining = MAX_IMAGES - pendingImages.value.length;
  if (remaining <= 0) {
    addToast("warning", `Maximum of ${MAX_IMAGES} images allowed.`);
    return;
  }

  const imageFiles = files
    .filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        addToast(
          "error",
          `"${f.name}" is not supported. Use PNG, JPG, or WebP.`,
        );
        return false;
      }
      return true;
    })
    .slice(0, remaining);

  if (
    imageFiles.length <
    files.filter((f) => ALLOWED_TYPES.includes(f.type)).length
  ) {
    addToast(
      "warning",
      `Only ${remaining} more image${remaining === 1 ? "" : "s"} allowed (max ${MAX_IMAGES}).`,
    );
  }

  for (const file of imageFiles) {
    let processed = file;
    if (file.size > MAX_FILE_SIZE) {
      try {
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

const handleNewChat = () => {
  messages.value = [];
  pendingImages.value = [];
  inputText.value = "";
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
