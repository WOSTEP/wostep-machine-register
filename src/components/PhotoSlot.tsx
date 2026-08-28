"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { photoPublicUrl, uploadPhoto } from "@/lib/data/photos";
import { downscaleToWebp } from "@/lib/image";
import { useLang } from "@/lib/i18n/LangProvider";
import { PhotoReframeModal } from "./PhotoReframeModal";
import type { Photo } from "@/lib/data/types";

export function PhotoSlot({
  machineId,
  label,
  photo,
  readOnly,
  height = 150,
  radius = 6,
  placeholder,
  emptyText,
  isOverview = false,
  onUploaded,
}: {
  machineId: string;
  label: string;
  photo: Photo | null;
  readOnly: boolean;
  height?: number;
  radius?: number;
  placeholder?: string;
  emptyText?: string;
  isOverview?: boolean;
  onUploaded?: (photo: Photo) => void;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [reframing, setReframing] = useState(false);
  const supabase = createClient();

  const url = photo?.storage_path ? photoPublicUrl(supabase, photo.storage_path) : null;

  async function handleFile(file: File | undefined | null) {
    if (!file || readOnly) return;
    setBusy(true);
    try {
      const blob = await downscaleToWebp(file);
      const updated = await uploadPhoto(supabase, {
        machineId,
        label,
        isOverview,
        blob,
        existingPhotoId: photo?.id,
      });
      onUploaded?.(updated);
    } finally {
      setBusy(false);
      setDragOver(false);
    }
  }

  return (
    <div
      onClick={() => !readOnly && inputRef.current?.click()}
      onDragOver={(e) => {
        if (readOnly) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (readOnly) return;
        e.preventDefault();
        void handleFile(e.dataTransfer.files?.[0]);
      }}
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: radius,
        backgroundColor: url ? undefined : "var(--sheet)",
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: photo
          ? `${photo.reframe_x * 100}% ${photo.reframe_y * 100}%`
          : "center",
        border: dragOver ? "1px dashed var(--red)" : undefined,
        cursor: readOnly ? "default" : "pointer",
        overflow: "hidden",
      }}
    >
      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      )}
      {!url && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 8,
            font: "400 12px/1.4 var(--font-body)",
            color: "var(--grey-label)",
          }}
        >
          {busy ? "…" : readOnly ? emptyText : placeholder}
        </div>
      )}
      {url && !readOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setReframing(true);
          }}
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            padding: "5px 10px",
            border: 0,
            borderRadius: 999,
            background: "rgba(0,0,0,.6)",
            color: "#fff",
            font: "500 11px/1 var(--font-display)",
            cursor: "pointer",
          }}
        >
          {t.reframe}
        </button>
      )}
      {reframing && photo && (
        <PhotoReframeModal
          photo={photo}
          onClose={() => setReframing(false)}
          onSaved={(updated) => onUploaded?.(updated)}
        />
      )}
    </div>
  );
}
