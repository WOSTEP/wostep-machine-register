"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { createRoom } from "@/lib/data/rooms";
import type { Room } from "@/lib/data/types";

export function RoomPicker({
  rooms,
  roomId,
  onSelect,
  onRoomCreated,
}: {
  rooms: Room[];
  roomId: string | null;
  onSelect: (id: string) => void;
  onRoomCreated: (room: Room) => void;
}) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [nameEN, setNameEN] = useState("");
  const [nameFR, setNameFR] = useState("");

  async function confirm() {
    if (!nameEN.trim() || !nameFR.trim()) return;
    const room = await createRoom(supabase, { name_en: nameEN.trim(), name_fr: nameFR.trim() });
    onRoomCreated(room);
    onSelect(room.id);
    setNameEN("");
    setNameFR("");
    setAdding(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--grey-label)" }}>
        {t.room}
      </span>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {rooms.map((r) => {
          const active = r.id === roomId;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              style={{
                padding: "9px 13px",
                border: active ? "1px solid var(--black)" : "1px solid rgba(0,0,0,.14)",
                borderRadius: 999,
                background: active ? "var(--black)" : "none",
                color: active ? "#fff" : "var(--black)",
                font: "500 12px/1 var(--font-body)",
                cursor: "pointer",
              }}
            >
              {lang === "EN" ? r.name_en : r.name_fr}
            </button>
          );
        })}
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: "9px 13px",
            border: "1px dashed rgba(0,0,0,.3)",
            borderRadius: 999,
            background: "none",
            color: "var(--red)",
            font: "500 12px/1 var(--font-body)",
            cursor: "pointer",
          }}
        >
          ＋ {t.addRoom}
        </button>
      </div>
      {adding && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: 13, borderRadius: 10, background: "var(--sheet)", border: "1px dashed rgba(0,0,0,.2)" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ font: "400 9.5px/1 var(--font-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--grey-label)" }}>
              {t.roomEN}
            </span>
            <input value={nameEN} onChange={(e) => setNameEN(e.target.value)} placeholder={t.roomENHint} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ font: "400 9.5px/1 var(--font-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--grey-label)" }}>
              {t.roomFR}
            </span>
            <input value={nameFR} onChange={(e) => setNameFR(e.target.value)} placeholder={t.roomFRHint} style={inputStyle} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
            <button onClick={confirm} style={{ padding: 12, border: 0, borderRadius: 9, background: "var(--black)", color: "var(--sheet)", font: "600 13px/1 var(--font-display)", cursor: "pointer" }}>
              {t.addBtn}
            </button>
            <button onClick={() => setAdding(false)} style={{ padding: 12, border: "1px solid rgba(0,0,0,.16)", borderRadius: 9, background: "#fff", color: "#4a4b4d", font: "500 13px/1 var(--font-display)", cursor: "pointer" }}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 11,
  border: "1px solid rgba(0,0,0,.16)",
  borderRadius: 9,
  background: "#ffffff",
  font: "400 14px/1 var(--font-body)",
  outline: "none",
};
