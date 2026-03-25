import { compressImage } from "~/utils/compressImage";
import log from "~/utils/log";

const BUCKET = "contract-images";
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export default () => {
  const { supabase, initializeSupabase } = useSupabaseClient();
  const { addToast } = useToast();

  const validateFiles = (
    files: File[],
    existingCount = 0,
  ): string | null => {
    const rules: { check: boolean; message: string }[] = [
      { check: files.length === 0, message: "At least one image is required." },
      {
        check: files.length + existingCount > MAX_IMAGES,
        message: `Maximum of ${MAX_IMAGES} images allowed.`,
      },
    ];

    const invalid = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid) {
      return `"${invalid.name}" is not supported. Use PNG, JPG, or WebP.`;
    }

    return rules.find((r) => r.check)?.message ?? null;
  };

  const uploadImages = async (
    files: File[],
    existingCount = 0,
  ): Promise<string[]> => {
    const error = validateFiles(files, existingCount);
    if (error) {
      addToast("error", error);
      return [];
    }

    try {
      if (!supabase.value) await initializeSupabase();
      if (!supabase.value) throw new Error("Supabase client not initialized");

      const compressed = await Promise.all(
        files.map((f) =>
          f.size > MAX_FILE_SIZE ? compressImage(f, 4) : Promise.resolve(f),
        ),
      );

      const urls = await Promise.all(
        compressed.map(async (file) => {
          const ext = file.name.split(".").pop() || "jpg";
          const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

          const { error: uploadError } = await supabase.value!.storage
            .from(BUCKET)
            .upload(path, file, { cacheControl: "3600", upsert: false });

          if (uploadError) throw uploadError;

          const { data } = supabase.value!.storage
            .from(BUCKET)
            .getPublicUrl(path);

          return data.publicUrl;
        }),
      );

      return urls;
    } catch (err) {
      log.error("Image upload failed:", err);
      addToast("error", "Failed to upload images. Please try again.");
      return [];
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      if (!supabase.value) await initializeSupabase();
      if (!supabase.value) throw new Error("Supabase client not initialized");

      const parts = imageUrl.split(`/${BUCKET}/`);
      const filePath = parts[parts.length - 1]?.split("?")[0];
      if (!filePath) return;

      const { error } = await supabase.value.storage
        .from(BUCKET)
        .remove([filePath]);

      if (error) throw error;
    } catch (err) {
      log.error("Image delete failed:", err);
      addToast("error", "Failed to delete image.");
    }
  };

  return {
    validateFiles,
    uploadImages,
    deleteImage,
  };
};
