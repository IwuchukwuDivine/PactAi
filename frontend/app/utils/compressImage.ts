/**
 * Compresses an image file to a target size (max 1MB)
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum size in MB (default: 1)
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1920)
 * @returns Compressed File object
 */
export const compressImage = async (
  file: File,
  maxSizeMB: number = 1,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<File> => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024 // Convert MB to bytes

  // If file is already smaller than max size, return as is
  if (file.size <= maxSizeBytes) {
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const tryCompressWithDimensions = (targetWidth: number, targetHeight: number) => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width
          let height = img.height

          if (width > targetWidth || height > targetHeight) {
            const ratio = Math.min(targetWidth / width, targetHeight / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          // Create canvas and compress
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height)

          // Use JPEG for better compression
          const fileExtension = 'jpg'
          const mimeType = 'image/jpeg'
          
          const tryCompress = (quality: number): void => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'))
                  return
                }

                // If size is acceptable, return
                if (blob.size <= maxSizeBytes) {
                  const fileName = file.name.split('.')[0]
                  const compressedFile = new File([blob], `${fileName}.${fileExtension}`, {
                    type: mimeType,
                    lastModified: Date.now()
                  })
                  resolve(compressedFile)
                } else if (quality > 0.3) {
                  // Reduce quality and try again
                  tryCompress(quality - 0.1)
                } else if (targetWidth > 800) {
                  // Quality is low but still too big - reduce dimensions
                  tryCompressWithDimensions(
                    Math.round(targetWidth * 0.75),
                    Math.round(targetHeight * 0.75)
                  )
                } else {
                  // Accept the best we can do at minimum quality and dimensions
                  const fileName = file.name.split('.')[0]
                  const compressedFile = new File([blob], `${fileName}.${fileExtension}`, {
                    type: mimeType,
                    lastModified: Date.now()
                  })
                  resolve(compressedFile)
                }
              },
              mimeType,
              quality
            )
          }

          tryCompress(0.85)
        }

        // Start with max dimensions
        tryCompressWithDimensions(maxWidth, maxHeight)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compresses multiple images
 */
export const compressImages = async (files: File[]): Promise<File[]> => {
  return Promise.all(files.map(file => compressImage(file)))
}

