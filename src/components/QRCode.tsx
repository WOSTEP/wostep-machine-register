"use client";

import { useEffect, useState } from "react";
import { generateBrandedQrDataUrl } from "@/lib/qr";

export function QRCodeTile({ value, size = 50 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    generateBrandedQrDataUrl(value, size * 4)
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div
      style={{
        flex: "none",
        width: size,
        height: size,
        padding: Math.round(size * 0.09),
        border: "1px solid rgba(0,0,0,.14)",
        borderRadius: 5,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="" width="100%" height="100%" style={{ display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "var(--sheet)" }} />
      )}
    </div>
  );
}
