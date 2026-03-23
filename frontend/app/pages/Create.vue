<template>
  <div class="create">
    <!-- Header -->
    <header class="create__header">
      <h1 class="create__title">New Contract</h1>
      <p class="create__subtitle">
        How would you like to create your contract?
      </p>
    </header>

    <!-- Method tabs -->
    <div class="create__methods">
      <button
        v-for="method in methods"
        :key="method.id"
        class="create__method"
        :class="{ 'create__method--active': activeMethod === method.id }"
        @click="activeMethod = method.id"
      >
        <component :is="method.icon" :size="16" />
        <span>{{ method.label }}</span>
      </button>
    </div>

    <!-- Input area -->
    <div class="create__input-area">
      <!-- Paste / Type -->
      <div v-if="activeMethod !== 'upload'" class="create__textarea-wrap">
        <textarea
          v-model="inputText"
          class="create__textarea"
          :placeholder="activePlaceholder"
          rows="10"
        />
        <div class="create__textarea-footer">
          <span class="create__char-count"
            >{{ inputText.length }} characters</span
          >
          <button
            v-if="activeMethod === 'paste'"
            class="create__paste-btn"
            @click="pasteFromClipboard"
          >
            <LucideClipboard :size="16" />
            Paste
          </button>
        </div>
      </div>

      <!-- Upload -->
      <div v-else class="create__upload">
        <!-- Hidden file input (lives outside clickable areas) -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          class="create__file-input-hidden"
          @change="handleFileSelect"
        />

        <!-- Dropzone -->
        <div
          class="create__dropzone"
          :class="{ 'create__dropzone--dragging': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @dragenter.prevent
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <div class="create__dropzone-icon">
            <LucideUploadCloud :size="36" />
          </div>
          <p class="create__dropzone-title">Tap to upload or drag & drop</p>
          <p class="create__dropzone-hint">
            PNG, JPG, WebP &bull; Max 4MB &bull; Up to 5 images
          </p>
        </div>

        <!-- Error message -->
        <p v-if="uploadError" class="create__upload-error">
          <LucideTriangleAlert :size="14" />
          {{ uploadError }}
        </p>

        <!-- Image previews -->
        <div v-if="uploadedImages.length" class="create__previews">
          <div
            v-for="(img, index) in uploadedImages"
            :key="img.id"
            class="create__preview"
          >
            <img
              :src="img.url"
              :alt="img.file.name"
              class="create__preview-img"
            />
            <div class="create__preview-overlay">
              <button
                class="create__preview-remove"
                @click="removeImage(index)"
              >
                <LucideX :size="14" />
              </button>
            </div>
            <div class="create__preview-info">
              <span class="create__preview-name">{{ img.file.name }}</span>
              <span class="create__preview-size">{{
                formatSize(img.file.size)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attachment chips (for paste/type modes) -->
    <div
      v-if="activeMethod !== 'upload' && uploadedImages.length"
      class="create__attachments"
    >
      <div
        v-for="(img, index) in uploadedImages"
        :key="img.id"
        class="create__attachment"
      >
        <img :src="img.url" alt="" class="create__attachment-thumb" />
        <span>{{ img.file.name }}</span>
        <button @click="removeImage(index)">
          <LucideX :size="14" />
        </button>
      </div>
    </div>

    <!-- Hidden file input for paste/type modes -->
    <input
      v-if="activeMethod !== 'upload'"
      ref="inlineFileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp"
      multiple
      class="create__file-input-hidden"
      @change="handleFileSelect"
    />

    <!-- Attach image button (for paste/type modes) -->
    <button
      v-if="activeMethod !== 'upload'"
      class="create__attach-btn"
      @click="triggerFileInput"
    >
      <LucidePaperclip :size="16" />
      Attach screenshot
    </button>

    <!-- Escrow section -->
    <EscrowConfig
      v-model:enabled="escrow.enabled"
      v-model:amount="escrow.amount"
      v-model:release-condition="escrow.releaseCondition"
      class="create__escrow"
    />

    <!-- Generate button -->
    <div class="create__footer">
      <AppButton
        title="Generate contract"
        variant="primary"
        block
        :disabled="!canGenerate"
        :loading="isGenerating"
        @click="handleGenerate"
      />
    </div>

    <!-- Info tip -->
    <div class="create__tip">
      <LucideInfo :size="14" />
      <span
        >Nigerian Pidgin is supported and will be translated correctly.</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  LucideClipboardPaste,
  LucidePenLine,
  LucideCamera,
} from "lucide-vue-next";
import type { ReleaseCondition } from "~/components/EscrowConfig.vue";
import { compressImage } from "~/utils/compressImage";

definePageMeta({ layout: "dashboard" });

const route = useRoute();
const validMethods = ["paste", "type", "upload"] as const;
type Method = (typeof validMethods)[number];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_IMAGES = 5;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

interface UploadedImage {
  id: string;
  file: File;
  url: string;
}

const getInitialMethod = (): Method => {
  const q = route.query.method as string | undefined;
  if (q && validMethods.includes(q as Method)) return q as Method;
  return "paste";
};

const activeMethod = ref<Method>(getInitialMethod());
const inputText = ref("");
const uploadedImages = ref<UploadedImage[]>([]);
const isDragging = ref(false);
const isGenerating = ref(false);
const uploadError = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const inlineFileInputRef = ref<HTMLInputElement | null>(null);

const methods = [
  { id: "paste" as const, label: "Paste", icon: LucideClipboardPaste },
  { id: "type" as const, label: "Type", icon: LucidePenLine },
  { id: "upload" as const, label: "Upload", icon: LucideCamera },
];

const escrow = reactive({
  enabled: false,
  amount: "",
  releaseCondition: "delivery" as ReleaseCondition,
});

const activePlaceholder = computed(() => {
  if (activeMethod.value === "paste") {
    return "Paste your WhatsApp, DM, email or any conversation here...";
  }
  return "Describe your agreement in your own words. Include parties involved, what's being exchanged, amounts, deadlines...";
});

const canGenerate = computed(() => {
  if (activeMethod.value === "upload") return uploadedImages.value.length > 0;
  return inputText.value.trim().length > 10 || uploadedImages.value.length > 0;
});

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const { addToast } = useToast();

const processFiles = async (files: File[]) => {
  uploadError.value = "";

  const remaining = MAX_IMAGES - uploadedImages.value.length;
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
        uploadError.value = `Failed to compress "${file.name}". Try a smaller image.`;
        continue;
      }
    }

    const url = URL.createObjectURL(processed);
    uploadedImages.value.push({
      id: crypto.randomUUID(),
      file: processed,
      url,
    });
  }
};

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    inputText.value = text;
  } catch {
    // clipboard access denied — user can paste manually
  }
};

const triggerFileInput = () => {
  if (activeMethod.value === "upload") {
    fileInputRef.value?.click();
  } else {
    inlineFileInputRef.value?.click();
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) {
    processFiles(Array.from(target.files));
    target.value = "";
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length) processFiles(files);
};

const removeImage = (index: number) => {
  const img = uploadedImages.value[index];
  if (img) URL.revokeObjectURL(img.url);
  uploadedImages.value.splice(index, 1);
};

const handleGenerate = async () => {
  if (!canGenerate.value) return;
  isGenerating.value = true;
  try {
    // TODO: implement contract generation API call
  } finally {
    isGenerating.value = false;
  }
};

onUnmounted(() => {
  uploadedImages.value.forEach((img) => URL.revokeObjectURL(img.url));
});
</script>

<style scoped>
.create {
  padding: 20px 20px 0;
  max-width: 560px;
  margin: 0 auto;
}

/* Header */
.create__header {
  margin-bottom: 24px;
}

.create__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 4px;
}

.create__subtitle {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
}

/* Method tabs */
.create__methods {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.create__method {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(45, 1, 2, 0.1);
  background: var(--color-white);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-gray-dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.create__method--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.create__method:not(.create__method--active):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Textarea */
.create__textarea-wrap {
  border: 1.5px solid rgba(45, 1, 2, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.create__textarea-wrap:focus-within {
  border-color: var(--color-primary);
}

.create__textarea {
  width: 100%;
  min-height: 200px;
  padding: 18px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-black);
  background: transparent;
  resize: vertical;
}

.create__textarea::placeholder {
  color: var(--color-gray-medium);
}

.create__textarea-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-top: 1px solid rgba(45, 1, 2, 0.06);
  background: rgba(45, 1, 2, 0.02);
}

.create__char-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-gray-muted);
}

.create__paste-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
}

.create__paste-btn:hover {
  text-decoration: underline;
}

/* Upload / Dropzone */
.create__dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 200px;
  padding: 32px 20px;
  border: 2px dashed var(--color-gray-light);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create__dropzone:hover,
.create__dropzone--dragging {
  border-color: var(--color-primary);
  background: rgba(45, 1, 2, 0.03);
}

.create__dropzone--dragging {
  border-color: var(--color-accent);
  background: rgba(170, 1, 1, 0.04);
}

.create__file-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.create__dropzone-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(45, 1, 2, 0.04);
  color: var(--color-gray-medium);
  transition: color 0.2s;
}

.create__dropzone--dragging .create__dropzone-icon {
  color: var(--color-accent);
}

.create__dropzone-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-black);
  margin: 4px 0 0;
}

.create__dropzone-hint {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-gray-dark);
  margin: 0;
}

/* Upload error */
.create__upload-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(170, 1, 1, 0.06);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-accent);
  line-height: 1.4;
}

.create__upload-error svg {
  flex-shrink: 0;
}

/* Image previews grid */
.create__previews {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.create__preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid rgba(45, 1, 2, 0.08);
  background: rgba(45, 1, 2, 0.02);
}

.create__preview-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
}

.create__preview-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
}

.create__preview-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: var(--color-white);
  border: none;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s;
}

.create__preview-remove:hover {
  background: rgba(170, 1, 1, 0.85);
}

.create__preview-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 10px;
}

.create__preview-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-black);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create__preview-size {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-gray-dark);
}

/* Attachment chips (paste/type mode) */
.create__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.create__attachment {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  border-radius: 20px;
  background: rgba(45, 1, 2, 0.04);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
}

.create__attachment-thumb {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  object-fit: cover;
}

.create__attachment button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0;
  margin-left: 2px;
}

/* Attach button */
.create__attach-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1.5px solid rgba(45, 1, 2, 0.1);
  background: var(--color-white);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  transition: border-color 0.2s;
}

.create__attach-btn:hover {
  border-color: var(--color-primary);
}

/* Footer */
.create__footer {
  margin-top: 24px;
}

/* Tip */
.create__tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(45, 1, 2, 0.03);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-gray-dark);
  line-height: 1.4;
}

.create__tip svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Escrow section */
.create__escrow {
  margin-top: 24px;
}

@media (min-width: 768px) {
  .create {
    padding: 28px 24px 0;
  }

  .create__title {
    font-size: 28px;
  }

  .create__textarea {
    min-height: 260px;
  }

  .create__previews {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
