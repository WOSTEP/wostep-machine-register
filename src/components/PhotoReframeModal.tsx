"use client";

import { useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { photoPublicUrl, updatePhotoReframe } from "@/lib/data/photos";
import type { Photo } from "@/lib/data/types";

export function PhotoReframeModal({
  photo,
  onClose,
  onSaved,
}: {
  photo: Photo;
  onClose: () => void;
  onSaved: (photo: Photo) => void;
}) {
  const { t } = useLang();
  const supabase = createClient();
  const [point, setPoint] = useState({ x: photo.reframe_x, y: photo.reframe_y });
  const [busy, setBusy] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const url = photo.storage_path ? photoPublicUrl(supabase, photo.storage_path) : null;

  function setFromEvent(clientX: number, clientY: number) {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setPoint({ x, y });
  }

  async function handleSave() {
    setBusy(true);
    try {
      const updated = await updatePhotoReframe(supabase, photo.id, {
        reframe_x: point.x,
        reframe_y: point.y,
      });
      onSaved(updated);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 14,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ font: "600 15px/1.2 var(--font-display)", color: "var(--black)" }}>
          {t.reframeTitle}
        </div>
        <div style={{ font: "400 12px/1.4 var(--font-body)", color: "var(--grey-text)" }}>
          {t.reframeHint}
        </div>

        <div
          ref={frameRef}
          onClick={(e) => setFromEvent(e.clientX, e.clientY)}
          onMouseDown={(e) => {
            const move = (ev: MouseEvent) => setFromEvent(ev.clientX, ev.clientY);
            const up = () => {
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
            setFromEvent(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            const t0 = e.touches[0];
            setFromEvent(t0.clientX, t0.clientY);
          }}
          onTouchMove={(e) => {
            const t0 = e.touches[0];
            setFromEvent(t0.clientX, t0.clientY);
          }}
          style={{
            position: "relative",
            width: "100%",
            height: 280,
            borderRadius: 8,
            overflow: "hidden",
            background: "#000",
            backgroundImage: url ? `url(${url})` : undefined,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            cursor: "crosshair",
            touchAction: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
              transform: "translate(-50%,-50%)",
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "3px solid var(--red)",
              boxShadow: "0 0 0 2px rgba(255,255,255,.9)",
              pointerEvents: "none",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
          <button
            onClick={handleSave}
            disabled={busy}
            style={{
              padding: 13,
              border: 0,
              borderRadius: 9,
              background: "var(--black)",
              color: "var(--sheet)",
              font: "600 13px/1 var(--font-display)",
              cursor: "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {t.saveFraming}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: 13,
              border: "1px solid rgba(0,0,0,.16)",
              borderRadius: 9,
              background: "#fff",
              color: "#4a4b4d",
              font: "500 13px/1 var(--font-display)",
              cursor: "pointer",
            }}
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
