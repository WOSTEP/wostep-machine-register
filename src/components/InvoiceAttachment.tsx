"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAttachmentUrl, isPdfPath } from "@/lib/data/attachments";
import { useLang } from "@/lib/i18n/LangProvider";

/**
 * Shows a service entry's attached invoice: a thumbnail for photos or a PDF
 * badge, plus View and Download links (signed URLs — the bucket is private).
 */
export function InvoiceAttachment({ path, fileBase }: { path: string; fileBase: string }) {
  const { t } = useLang();
  const supabase = createClient();
  const pdf = isPdfPath(path);
  const ext = path.split(".").pop() ?? "file";
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAttachmentUrl(supabase, path)
      .then((u) => !cancelled && setViewUrl(u))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  async function download() {
    try {
      const url = await getAttachmentUrl(supabase, path, `${fileBase}.${ext}`);
      window.location.href = url;
    } catch {
      setFailed(true);
    }
  }

  if (failed) {
    return <div style={{ marginTop: 8, font: "400 11px/1.3 var(--font-body)", color: "var(--red)" }}>{t.invoiceLoadFailed}</div>;
  }

  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
      <a
        href={viewUrl ?? undefined}
        target="_blank"
        rel="noreferrer"
        style={{
          flex: "none",
          width: 56,
          height: 56,
          borderRadius: 6,
          border: "1px solid rgba(0,0,0,.12)",
          background: "var(--sheet)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "600 11px/1 var(--font-display)",
          color: "var(--red)",
          textDecoration: "none",
        }}
      >
        {pdf || !viewUrl ? (
          "PDF"
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={viewUrl} alt={t.viewInvoice} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </a>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <a
          href={viewUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          style={{ font: "500 12px/1 var(--font-display)", color: "var(--black)", textDecoration: "underline" }}
        >
          {t.openInvoice}
        </a>
        <button
          onClick={download}
          style={{ padding: 0, border: 0, background: "none", textAlign: "left", cursor: "pointer", font: "500 12px/1 var(--font-display)", color: "var(--red)", textDecoration: "underline" }}
        >
          {t.downloadInvoice}
        </button>
      </div>
    </div>
  );
}
