"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenChrome } from "@/components/ScreenChrome";
import { RoomPicker } from "@/components/RoomPicker";
import { IntervalPicker } from "@/components/IntervalPicker";
import { useLang } from "@/lib/i18n/LangProvider";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import { updateMachine } from "@/lib/data/machines";
import { formatDate, parseDisplayDate, toISODate, parseISODate } from "@/lib/status";
import type { MachineSummary, Room } from "@/lib/data/types";

export function EditMachineClient({
  machine,
  initialRooms,
}: {
  machine: MachineSummary;
  initialRooms: Room[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const showToast = useToast();
  const supabase = createClient();

  const [rooms, setRooms] = useState(initialRooms);
  const [assetTag, setAssetTag] = useState(machine.asset_tag);
  const [invRef, setInvRef] = useState(machine.inv_ref ?? "");
  const [name, setName] = useState(machine.name);
  const [manufacturer, setManufacturer] = useState(machine.manufacturer ?? "");
  const [serial, setSerial] = useState(machine.serial ?? "");
  const [year, setYear] = useState(machine.year ?? "");
  const [roomId, setRoomId] = useState<string | null>(machine.room_id);
  const [interval, setIntervalMonths] = useState(machine.interval_months);
  const [lastService, setLastService] = useState(formatDate(parseISODate(machine.last_service)));
  const [nextDue, setNextDue] = useState(formatDate(parseISODate(machine.next_due)));
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!name.trim() || !roomId) return;
    setBusy(true);
    try {
      const lastServiceISO = parseDisplayDate(lastService);
      const nextDueISO = parseDisplayDate(nextDue);
      await updateMachine(supabase, machine.id, {
        asset_tag: assetTag.trim(),
        name: name.trim(),
        manufacturer: manufacturer || null,
        room_id: roomId,
        serial: serial || null,
        year: year || null,
        interval_months: interval,
        last_service: lastServiceISO ? toISODate(lastServiceISO) : null,
        next_due: nextDueISO ? toISODate(nextDueISO) : null,
        inv_ref: invRef || null,
      });
      showToast(t.editedTitle, t.editedBody);
      router.push(`/app/register/${assetTag.trim()}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ScreenChrome title={t.tEdit} subtitle={t.sEdit} backHref={`/app/register/${machine.asset_tag}`} backLabel={t.back} />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label={t.fTag} value={assetTag} onChange={setAssetTag} />
        <Field label={t.fInv} value={invRef} onChange={setInvRef} />
        <Field label={t.fName} value={name} onChange={setName} />
        <Field label={t.fMaker} value={manufacturer} onChange={setManufacturer} />
        <Field label={t.fSerial} value={serial} onChange={setSerial} />
        <Field label={t.fYear} value={year} onChange={setYear} />

        <RoomPicker
          rooms={rooms}
          roomId={roomId}
          onSelect={setRoomId}
          onRoomCreated={(r) => setRooms((prev) => [...prev, r])}
        />

        <IntervalPicker value={interval} onChange={setIntervalMonths} note={`30 ${t.daysBefore}`} />

        <Field label={t.fLast} value={lastService} onChange={setLastService} />
        <Field label={t.nextDateLabel} value={nextDue} onChange={setNextDue} />

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
          {t.saveChanges}
        </button>
      </div>
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--grey-label)" }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
