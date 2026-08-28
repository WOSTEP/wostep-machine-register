"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { downloadBlob, generateBrandedQrBlob } from "@/lib/qr";

export function DownloadQrButton({
  assetTag,
  value,
  compact = false,
}: {
  assetTag: string;
  value: string;
  compact?: boolean;
}) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const blob = await generateBrandedQrBlob(value);
      downloadBlob(blob, `${assetTag}-qr.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      title={t.downloadQr}
      style={{
        padding: 0,
        border: 0,
        background: "none",
        font: compact ? "400 13px/1 var(--font-display)" : "500 11px/1 var(--font-display)",
        color: "var(--red)",
        textDecoration: compact ? "none" : "underline",
        whiteSpace: "nowrap",
        cursor: "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? "…" : compact ? "⬇" : t.downloadQr}
    </button>
  );
}
