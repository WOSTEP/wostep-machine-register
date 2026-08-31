"use client";

import { useState } from "react";
import Image from "next/image";
import { ScreenShell } from "@/components/ScreenShell";
import { ScreenChrome } from "@/components/ScreenChrome";
import { TabBar } from "@/components/TabBar";
import { PhotoSlot } from "@/components/PhotoSlot";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { createPhotoSlot } from "@/lib/data/photos";
import { formatDate } from "@/lib/status";
import type { MachineSummary, Photo } from "@/lib/data/types";

export function PhotosClient({
  machine,
  initialPhotos,
  isStaff,
}: {
  machine: MachineSummary;
  initialPhotos: Photo[];
  isStaff: boolean;
}) {
  const { t, lang } = useLang();
  const [photos, setPhotos] = useState(initialPhotos);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const supabase = createClient();
  const roomName = lang === "EN" ? machine.room_name_en : machine.room_name_fr;

  function upsertPhoto(updated: Photo) {
    setPhotos((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [...prev, updated];
    });
  }

  async function confirmAdd() {
    if (!newLabel.trim()) return;
    const slot = await createPhotoSlot(supabase, { machineId: machine.id, label: newLabel.trim() });
    setPhotos((prev) => [...prev, slot]);
    setNewLabel("");
    setAdding(false);
  }

  return (
    <ScreenShell background="#ffffff">
      <ScreenChrome
        title={t.tPhotos}
        subtitle={t.sPhotos}
        backHref={isStaff ? `/app/register/${machine.asset_tag}` : `/m/${machine.asset_tag}`}
        backLabel={t.back}
      />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {!isStaff && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#ffffff",
              border: "1px solid var(--border)",
            }}
          >
            <Image src="/logo-icon-watermark.png" alt="" width={34} height={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "500 14px/1.2 var(--font-display)", color: "var(--black)" }}>
                {machine.name}
              </div>
              <div style={{ marginTop: 3, font: "400 11px/1 var(--font-body)", color: "var(--grey-label)" }}>
                {machine.asset_tag} · {roomName}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            padding: "13px 14px",
            borderRadius: 4,
            background: "var(--sheet)",
            borderLeft: "3px solid var(--red)",
          }}
        >
          <div style={{ font: "400 12px/1.5 var(--font-body)", color: "#4a4b4d" }}>
            {isStaff ? t.photoIntroStaff : t.photoIntro}
          </div>
        </div>

        {photos.map((p) => (
          <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div style={{ font: "500 14px/1.2 var(--font-display)", color: "var(--black)" }}>{p.label}</div>
              <div style={{ font: "400 10px/1 var(--font-body)", color: "var(--grey-label)" }}>
                {t.lastUpdated} {formatDate(p.updated_at)}
              </div>
            </div>
            <PhotoSlot
              machineId={machine.id}
              label={p.label}
              photo={p}
              readOnly={!isStaff}
              height={262}
              radius={6}
              placeholder={t.dropHint}
              emptyText={t.noPhotoYet}
              isOverview={p.is_overview}
              onUploaded={upsertPhoto}
            />
          </div>
        ))}

        {isStaff && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 9,
              padding: 14,
              borderRadius: 10,
              background: "var(--sheet)",
              border: "1px dashed rgba(0,0,0,.2)",
            }}
          >
            {adding && (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <span
                  style={{
                    font: "500 10px/1 var(--font-body)",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--grey-label)",
                  }}
                >
                  {t.photoTitle}
                </span>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={t.photoTitleHint}
                  style={{
                    padding: 12,
                    border: "1px solid rgba(0,0,0,.16)",
                    borderRadius: 9,
                    background: "#ffffff",
                    font: "400 14px/1 var(--font-body)",
                    outline: "none",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
                  <button
                    onClick={confirmAdd}
                    style={{
                      padding: 12,
                      border: 0,
                      borderRadius: 9,
                      background: "var(--black)",
                      color: "var(--sheet)",
                      font: "600 13px/1 var(--font-display)",
                      cursor: "pointer",
                    }}
                  >
                    {t.addBtn}
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    style={{
                      padding: 12,
                      border: "1px solid rgba(0,0,0,.16)",
                      borderRadius: 9,
                      background: "#ffffff",
                      color: "#4a4b4d",
                      font: "500 13px/1 var(--font-display)",
                      cursor: "pointer",
                    }}
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 13,
                  border: 0,
                  borderRadius: 9,
                  background: "var(--red)",
                  color: "#ffffff",
                  font: "600 13px/1 var(--font-display)",
                  cursor: "pointer",
                }}
              >
                ＋ {t.addPhoto}
              </button>
            )}
            <div style={{ font: "400 11px/1.45 var(--font-body)", color: "var(--grey-text)" }}>
              {t.noExtraPhotos}
            </div>
          </div>
        )}

        <a
          href={`/m/${machine.asset_tag}/fault`}
          style={{
            marginTop: 4,
            padding: 15,
            border: "1px solid var(--red)",
            borderRadius: 10,
            background: "#ffffff",
            color: "var(--red)",
            font: "600 14px/1 var(--font-display)",
            textAlign: "center",
          }}
        >
          {t.reportFault}
        </a>
      </div>
      {isStaff && <TabBar />}
    </ScreenShell>
  );
}
