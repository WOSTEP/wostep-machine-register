"use client";

/**
 * Downscales an image file to ~1800px on the long side and re-encodes as
 * WebP at ~0.9 quality before upload — per the README's "Photo handling"
 * rule: good enough to read a drawer, small enough for the free storage tier.
 */
export async function downscaleToWebp(
  file: File,
  maxSize = 1800,
  quality = 0.9
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      "image/webp",
      quality
    );
  });
}
