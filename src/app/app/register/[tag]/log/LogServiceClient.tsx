"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenChrome } from "@/components/ScreenChrome";
import { useLang } from "@/lib/i18n/LangProvider";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import { logService } from "@/lib/data/services";
import { downscaleToWebp } from "@/lib/image";
import { WORK_TYPES, workTypeLabel } from "@/lib/labels";
import { addMonths, formatDate, parseDisplayDate, toISODate, addDays } from "@/lib/status";
import type { MachineSummary } from "@/lib/data/types";
import type { WorkType } from "@/lib/supabase/types";

export function LogServiceClient({
  machine,
  leadDays,
  signedInEmail,
  personId,
}: {
  machine: MachineSummary;
  leadDays: number;
  signedInEmail: string;
  personId: string | null;
}) {
  const { t } = useLang();
  const router = useRouter();
  const showToast = useToast();
  const supabase = createClient();

  const [workType, setWorkType] = useState<WorkType>("annual_service");
  const [date, setDate] = useState(formatDate(new Date()));
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [parts, setParts] = useState("");
  const [invNo, setInvNo] = useState("");
  const [amount, setAmount] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [nextDue, setNextDue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suggestedNext = useMemo(() => {
    const d = parseDisplayDate(date);
    if (!d) return null;
    return formatDate(addMonths(d, machine.interval_months));
  }, [date, machine.interval_months]);

  const effectiveNext = nextDue ?? suggestedNext;
  const alarmDate = useMemo(() => {
    const d = parseDisplayDate(effectiveNext);
    return d ? formatDate(addDays(d, -leadDays)) : "—";
  }, [effectiveNext, leadDays]);

  async function handleSave() {
    const serviceDate = parseDisplayDate(date);
    const nextDueDate = parseDisplayDate(effectiveNext ?? "");
    if (!serviceDate || !nextDueDate) return;
    setBusy(true);
    try {
      let attachment_path: string | null = null;
      if (invoiceFile) {
        const blob = await downscaleToWebp(invoiceFile);
        const path = `${machine.id}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from("service-attachments")
          .upload(path, blob, { contentType: "image/webp" });
        if (!error) attachment_path = path;
      }

      await logService(supabase, {
        machine_id: machine.id,
        date: toISODate(serviceDate),
        work_type: workType,
        time_spent: hours || null,
        notes: notes || null,
        parts_used: parts || null,
        signed_off_by: personId,
        signed_off_by_name: personId ? null : signedInEmail,
        invoice_number: invNo || null,
        supplier: supplier || null,
        amount_chf: amount ? Number(amount) : null,
        attachment_path,
        nextDue: toISODate(nextDueDate),
      });

      showToast(t.savedTitle, t.savedBody);
      router.push(`/app/register/${machine.asset_tag}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ScreenChrome
        title={t.tLog}
        subtitle={t.sLog}
        backHref={`/app/register/${machine.asset_tag}`}
        backLabel={t.back}
      />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)" }}>
          <div style={{ font: "400 11px/1 var(--font-body)", color: "var(--red)" }}>{machine.asset_tag}</div>
          <div style={{ marginTop: 4, font: "600 15px/1.2 var(--font-display)" }}>{machine.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <Label>{t.workDone}</Label>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {WORK_TYPES.map((w) => (
              <Chip key={w} active={workType === w} onClick={() => setWorkType(w)}>
                {workTypeLabel(w, t)}
              </Chip>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <Label>{t.date}</Label>
            <input value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <Label>{t.hours}</Label>
            <input value={hours} onChange={(e) => setHours(e.target.value)} style={fieldStyle} />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>{t.notes}</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notesHint}
            style={{ ...fieldStyle, height: 88, resize: "none", fontFamily: "var(--font-display)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>{t.partsUsed}</Label>
          <input value={parts} onChange={(e) => setParts(e.target.value)} placeholder={t.partsHint} style={fieldStyle} />
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <Label>{t.invoice}</Label>
          <label
            style={{
              height: 150,
              borderRadius: 6,
              background: "var(--sheet)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "400 12px/1 var(--font-display)",
              color: "var(--grey-label)",
              cursor: "pointer",
              textAlign: "center",
              padding: 8,
            }}
          >
            {invoiceFile ? invoiceFile.name : t.invoiceHint}
            <input type="file" accept="image/*" hidden onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)", gap: 9 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
              <SmallLabel>{t.invoiceNo}</SmallLabel>
              <input value={invNo} onChange={(e) => setInvNo(e.target.value)} placeholder={t.invoiceNoHint} style={smallFieldStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
              <SmallLabel>{t.amount}</SmallLabel>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t.amountHint} style={smallFieldStyle} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <SmallLabel>{t.supplier}</SmallLabel>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder={t.supplierHint} style={smallFieldStyle} />
          </label>
          <div style={{ font: "400 11px/1.45 var(--font-body)", color: "var(--grey-label)" }}>{t.invoiceOptional}</div>
        </div>

        <div style={{ padding: "13px 14px", borderRadius: 10, background: "var(--sheet)", border: "1px dashed rgba(249,49,57,.5)" }}>
          <div style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--red)" }}>
            {t.nextDueAuto}
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 9 }}>
            <input
              value={effectiveNext ?? ""}
              onChange={(e) => setNextDue(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "11px 12px",
                border: "1px solid rgba(0,0,0,.16)",
                borderRadius: 8,
                background: "#ffffff",
                font: "600 15px/1 var(--font-display)",
                color: "var(--black)",
                outline: "none",
              }}
            />
            {nextDue && nextDue !== suggestedNext && (
              <button
                onClick={() => setNextDue(null)}
                style={{
                  flex: "none",
                  padding: 0,
                  border: 0,
                  background: "none",
                  font: "500 11px/1.3 var(--font-display)",
                  color: "var(--red)",
                  cursor: "pointer",
                  textAlign: "left",
                  maxWidth: 96,
                }}
              >
                {t.useSuggested} {suggestedNext}
              </button>
            )}
          </div>
          <div style={{ marginTop: 8, font: "400 11px/1.4 var(--font-body)", color: "var(--grey-text)" }}>
            {t.alarmWillFire} {alarmDate}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={busy}
          style={{
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
          {t.saveSignOff}
        </button>
        <div style={{ font: "400 11px/1.45 var(--font-body)", color: "var(--grey-label)", textAlign: "center" }}>
          {t.signedAs} {signedInEmail} · {t.signoffRule}
        </div>
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--grey-label)" }}>
      {children}
    </div>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ font: "400 9.5px/1 var(--font-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--grey-label)" }}>
      {children}
    </span>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 13px",
        border: active ? "1px solid var(--black)" : "1px solid rgba(0,0,0,.14)",
        borderRadius: 999,
        background: active ? "var(--black)" : "#fff",
        color: active ? "#fff" : "var(--black)",
        font: "500 12px/1 var(--font-display)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const fieldStyle: React.CSSProperties = {
  padding: 12,
  border: "1px solid rgba(0,0,0,.14)",
  borderRadius: 9,
  background: "#fff",
  font: "400 14px/1 var(--font-body)",
  outline: "none",
};

const smallFieldStyle: React.CSSProperties = {
  padding: 11,
  border: "1px solid rgba(0,0,0,.14)",
  borderRadius: 9,
  background: "#fff",
  font: "400 13px/1 var(--font-body)",
  outline: "none",
  minWidth: 0,
};
