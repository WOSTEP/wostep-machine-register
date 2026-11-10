"use client";

import { downscaleToWebp } from "../image";
import type { DB } from "./types";

const BUCKET = "service-attachments";
const MAX_PDF_BYTES = 15 * 1024 * 1024;

/** File types the invoice picker accepts: any photo, or a PDF scan. */
export const ATTACHMENT_ACCEPT = "image/*,application/pdf,.pdf";

export function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith(".pdf");
}

/**
 * Uploads a service invoice/attachment and returns its storage path.
 * Photos are downscaled to WebP (README "Photo handling"); PDFs are stored
 * as-is. Throws on failure so the caller can tell the user instead of
 * silently saving the entry without its invoice.
 */
export async function uploadServiceAttachment(
  db: DB,
  machineId: string,
  file: File
): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  let body: Blob = file;
  let ext = "pdf";
  let contentType = "application/pdf";

  if (isPdf) {
    if (file.size > MAX_PDF_BYTES) throw new Error("PDF is larger than 15 MB");
  } else {
    try {
      body = await downscaleToWebp(file);
      ext = "webp";
      contentType = "image/webp";
    } catch {
      // Browser can't decode this format (e.g. HEIC on some browsers):
      // keep the original file rather than failing the upload.
      body = file;
      contentType = file.type || "application/octet-stream";
      ext = (file.name.split(".").pop() || "img").toLowerCase();
    }
  }

  const path = `${machineId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, body, { contentType });
  if (error) throw error;
  return path;
}

/**
 * Short-lived signed URL for a private attachment. With `downloadName`
 * the browser saves the file instead of displaying it.
 */
export async function getAttachmentUrl(
  db: DB,
  path: string,
  downloadName?: string
): Promise<string> {
  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10, downloadName ? { download: downloadName } : undefined);
  if (error) throw error;
  return data.signedUrl;
}
