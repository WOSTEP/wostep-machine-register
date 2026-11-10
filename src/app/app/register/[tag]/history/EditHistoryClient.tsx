"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenChrome } from "@/components/ScreenChrome";
import { useLang } from "@/lib/i18n/LangProvider";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import { updateService } from "@/lib/data/services";
import { ATTACHMENT_ACCEPT, uploadServiceAttachment } from "@/lib/data/attachments";
import { InvoiceAttachment } from "@/components/InvoiceAttachment";
import { formatDate, parseDisplayDate, toISODate } from "@/lib/status";
import { WORK_TYPES, workTypeLabel } from "@/lib/labels";
import type { MachineSummary, Service } from "@/lib/data/types";
import type { WorkType } from "@/lib/supabase/types";

type Draft = {
  work_type: WorkType;
  date: string;
  notes: string;
  invoice_number: string;
  file: File | null;
};

export function EditHistoryClient({
  machine,
  initialServices,
}: {
  machine: MachineSummary;
  initialServices: Service[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const showToast = useToast();
  const supabase = createClient();

  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    Object.fromEntries(
      initialServices.map((s) => [
        s.id,
        {
          work_type: s.work_type,
          date: formatDate(new Date(s.date)),
          notes: s.notes ?? "",
          invoice_number: s.invoice_number ?? "",
          file: null,
        },
      ])
    )
  );
  const [busy, setBusy] = useState(false);

  function patch(id: string, partial: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...partial } }));
  }

  async function handleSave() {
    setBusy(true);
    try {
      await Promise.all(
        initialServices.map(async (s) => {
          const d = drafts[s.id];
          const date = parseDisplayDate(d.date);
          const attachment_path = d.file
            ? await uploadServiceAttachment(supabase, machine.id, d.file)
            : s.attachment_path;
          return updateService(supabase, s.id, {
            work_type: d.work_type,
            date: date ? toISODate(date) : s.date,
            notes: d.notes || null,
            invoice_number: d.invoice_number || null,
            attachment_path,
          });
        })
      );
      showToast(t.histSaved);
      router.push(`/app/register/${machine.asset_tag}`);
      router.refresh();
    } catch (e) {
      showToast(t.saveFailed, e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ScreenChrome title={t.tEditHist} subtitle={t.sEditHist} backHref={`/app/register/${machine.asset_tag}`} backLabel={t.back} />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {initialServices.length === 0 ? (
          <div style={{ padding: 14, borderRadius: 10, background: "var(--sheet)", font: "400 12px/1.5 var(--font-body)", color: "var(--grey-text)" }}>
            {t.noHistory}
          </div>
        ) : (
          initialServices.map((s, i) => {
            const d = drafts[s.id];
            return (
              <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 9, padding: 14, borderRadius: 11, background: "#fff", border: "1px solid var(--border)" }}>
                <div style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--grey-label)" }}>
                  {t.entry} {i + 1}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 9 }}>
                  <select
                    value={d.work_type}
                    onChange={(e) => patch(s.id, { work_type: e.target.value as WorkType })}
                    style={{ ...smallField, fontFamily: "var(--font-display)" }}
                  >
                    {WORK_TYPES.map((w) => (
                      <option key={w} value={w}>
                        {workTypeLabel(w, t)}
                      </option>
                    ))}
                  </select>
                  <input value={d.date} onChange={(e) => patch(s.id, { date: e.target.value })} style={smallField} />
                </div>
                <textarea
                  value={d.notes}
                  onChange={(e) => patch(s.id, { notes: e.target.value })}
                  style={{ ...smallField, height: 74, resize: "none" }}
                />
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ font: "400 9.5px/1 var(--font-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--grey-label)" }}>
                    {t.invoiceLine}
                  </span>
                  <input
                    value={d.invoice_number}
                    onChange={(e) => patch(s.id, { invoice_number: e.target.value })}
                    placeholder={t.invoiceNoHint}
                    style={smallField}
                  />
                </label>
                {s.attachment_path && !d.file && (
                  <InvoiceAttachment path={s.attachment_path} fileBase={`${machine.asset_tag}_${s.date}_invoice`} />
                )}
                <label
                  style={{
                    padding: "10px 12px",
                    borderRadius: 9,
                    border: "1px dashed rgba(0,0,0,.2)",
                    background: "var(--sheet)",
                    font: "400 12px/1.3 var(--font-display)",
                    color: "var(--grey-label)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {d.file ? d.file.name : s.attachment_path ? t.replaceInvoice : t.attachInvoice}
                  <input
                    type="file"
                    accept={ATTACHMENT_ACCEPT}
                    hidden
                    onChange={(e) => patch(s.id, { file: e.target.files?.[0] ?? null })}
                  />
                </label>
              </div>
            );
          })
        )}

        {initialServices.length > 0 && (
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
            {t.saveChanges}
          </button>
        )}
      </div>
    </>
  );
}

const smallField: React.CSSProperties = {
  padding: 11,
  border: "1px solid rgba(0,0,0,.14)",
  borderRadius: 9,
  background: "var(--sheet-warm)",
  font: "400 13px/1 var(--font-body)",
  outline: "none",
  minWidth: 0,
};
