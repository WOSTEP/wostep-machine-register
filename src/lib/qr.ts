"use client";

import QRCode from "qrcode";

/**
 * Renders a QR code with the WOSTEP clock watermarked in the centre, onto a
 * canvas. Uses "H" (high, ~30% recoverable) error correction so the small
 * area the logo covers stays comfortably within what a scanner can
 * reconstruct — this is the standard technique for branded QR codes, not a
 * hack specific to this logo. Shared by both the on-page preview tiles and
 * the print-quality download.
 */
async function renderBrandedQrCanvas(value: string, size: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, value, {
    errorCorrectionLevel: "H",
    width: size,
    margin: 3,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const logo = await loadImage("/logo-icon-watermark.png");
  const logoSize = size * 0.22;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;
  const pad = logoSize * 0.05;

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, (logoSize + pad * 2) * 0.16);
  ctx.fill();
  ctx.drawImage(logo, x, y, logoSize, logoSize);

  return canvas;
}

/** Print-quality PNG blob, for download/print. */
export async function generateBrandedQrBlob(value: string, size = 1200): Promise<Blob> {
  const canvas = await renderBrandedQrCanvas(value, size);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("QR export failed"))), "image/png");
  });
}

/** Small data URL, for inline <img> previews (register, machine record, add screen). */
export async function generateBrandedQrDataUrl(value: string, size = 200): Promise<string> {
  const canvas = await renderBrandedQrCanvas(value, size);
  return canvas.toDataURL("image/png");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
