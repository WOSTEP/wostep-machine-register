"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenChrome } from "@/components/ScreenChrome";
import { RoomPicker } from "@/components/RoomPicker";
import { IntervalPicker } from "@/components/IntervalPicker";
import { QRCodeTile } from "@/components/QRCode";
import { useLang } from "@/lib/i18n/LangProvider";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import { createMachine, nextAssetTagSuffix } from "@/lib/data/machines";
import { addMonths, formatDate, parseDisplayDate, toISODate } from "@/lib/status";
import type { Room } from "@/lib/data/types";

function tagPrefix(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return (letters.slice(0, 3) || "MCH").padEnd(3, "X");
}

export function AddMachineClient({ initialRooms }: { initialRooms: Room[] }) {
  const { t } = useLang();
  const router = useRouter();
  const showToast = useToast();
  const supabase = createClient();

  const [rooms, setRooms] = useState(initialRooms);
  const [invRef, setInvRef] = useState("");
  const [name, setName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [serial, setSerial] = useState("");
  const [year, setYear] = useState("");
  const [roomId, setRoomId] = useState<string | null>(initialRooms[0]?.id ?? null);
  const [interval, setIntervalMonths] = useState(36);
  const [lastService, setLastService] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [photosTarget, setPhotosTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewTag, setPreviewTag] = useState("NEW-01");

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function refreshTagPreview() {
    const prefix = tagPrefix(name);
    const suffix = await nextAssetTagSuffix(supabase, `${prefix}-`);
    setPreviewTag(`${prefix}-${suffix}`);
  }

  const computedNextDue = useMemo(() => {
    if (nextDue) return nextDue;
    const d = parseDisplayDate(lastService);
    return d ? formatDate(addMonths(d, interval)) : "";
  }, [nextDue, lastService, interval]);

  async function handleSave() {
    if (!name.trim() || !roomId) return;
    setBusy(true);
    try {
      const prefix = tagPrefix(name);
      const suffix = await nextAssetTagSuffix(supabase, `${prefix}-`);
      const assetTag = `${prefix}-${suffix}`;
      const lastServiceISO = parseDisplayDate(lastService);
      const nextDueISO = parseDisplayDate(computedNextDue);

      await createMachine(supabase, {
        asset_tag: assetTag,
        name: name.trim(),
        manufacturer: manufacturer || null,
        room_id: roomId,
        serial: serial || null,
        year: year || null,
        interval_months: interval,
        last_service: lastServiceISO ? toISODate(lastServiceISO) : null,
        next_due: nextDueISO ? toISODate(nextDueISO) : null,
        photos_target: photosTarget ? Number(photosTarget) : null,
        inv_ref: invRef || null,
      });

      showToast(t.addedTitle, t.addedBody);
      router.push(`/app/register/${assetTag}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ScreenChrome title={t.tAdd} subtitle={t.sAdd} backHref="/app/register" backLabel={t.tList} />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            padding: 14,
            borderRadius: 11,
            background: "var(--sheet)",
            border: "1px dashed rgba(249,49,57,.5)",
          }}
        >
          <QRCodeTile value={`${origin}/m/${previewTag}`} size={62} />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--red)" }}>
              {t.tagAssigned}
            </div>
            <div style={{ marginTop: 6, font: "500 15px/1 var(--font-body)", color: "var(--black)" }}>{previewTag}</div>
            <div style={{ marginTop: 6, font: "400 11px/1.35 var(--font-display)", color: "var(--grey-text)" }}>
              {t.printTag}
            </div>
          </div>
        </div>

        <Field label={t.fInv} value={invRef} onChange={setInvRef} />
        <Field label={t.fName} value={name} onChange={setName} onBlur={refreshTagPreview} />
        <Field label={t.fMaker} value={manufacturer} onChange={setManufacturer} />
        <Field label={t.fSerial} value={serial} onChange={setSerial} />
        <Field label={t.fYear} value={year} onChange={setYear} />

        <RoomPicker
          rooms={rooms}
          roomId={roomId}
          onSelect={setRoomId}
          onRoomCreated={(r) => setRooms((prev) => [...prev, r])}
        />

        <IntervalPicker value={interval} onChange={setIntervalMonths} />

        <Field label={t.fLast} value={lastService} onChange={setLastService} placeholder="DD.MM.YYYY" />
        <Field label={t.nextDateLabel} value={nextDue} onChange={setNextDue} placeholder={computedNextDue || t.fNextAuto} />
        <Field label={t.fDrawers} value={photosTarget} onChange={setPhotosTarget} />

        <div style={{ font: "400 11px/1.45 var(--font-body)", color: "var(--grey-text)" }}>{t.addPhotosAfterNote}</div>

        <button
          onClick={handleSave}
          disabled={busy}
          style={{
            marginTop: 4,
            padding: 15,
            border: 0,
            borderRadius: 10,
            background: "var(--black)",
            color: "var(--sheet)",
            font: "600 14px/1 var(--font-display)",
            cursor: "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {t.addToRegister}
        </button>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onBlur?: () => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--grey-label)" }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{
          padding: 12,
          border: "1px solid rgba(0,0,0,.14)",
          borderRadius: 9,
          background: "#fff",
          font: "400 14px/1 var(--font-body)",
          outline: "none",
        }}
      />
    </label>
  );
}
