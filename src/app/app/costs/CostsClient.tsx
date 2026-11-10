"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScreenChrome } from "@/components/ScreenChrome";
import { InvoiceAttachment } from "@/components/InvoiceAttachment";
import { useLang } from "@/lib/i18n/LangProvider";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import { addGeneralCost, deleteGeneralCost, formatCHF, type ServiceCostRow } from "@/lib/data/costs";
import { ATTACHMENT_ACCEPT, uploadServiceAttachment } from "@/lib/data/attachments";
import { formatDate, parseDisplayDate, toISODate } from "@/lib/status";
import type { GeneralCost } from "@/lib/data/types";

type MachineLite = { id: string; name: string; asset_tag: string };

const yearOf = (iso: string) => Number(iso.slice(0, 4));

export function CostsClient({
  machines,
  serviceCosts,
  initialGeneralCosts,
  generalReady,
  signedInEmail,
  personId,
}: {
  machines: MachineLite[];
  serviceCosts: ServiceCostRow[];
  initialGeneralCosts: GeneralCost[];
  generalReady: boolean;
  signedInEmail: string;
  personId: string | null;
}) {
  const { t } = useLang();
  const router = useRouter();
  const showToast = useToast();
  const supabase = createClient();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [general, setGeneral] = useState(initialGeneralCosts);
  const [adding, setAdding] = useState(false);

  const years = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    serviceCosts.forEach((s) => set.add(yearOf(s.date)));
    general.forEach((g) => set.add(yearOf(g.date)));
    return [...set].sort((a, b) => a - b);
  }, [serviceCosts, general]);

  const perMachine = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of serviceCosts) {
      if (yearOf(s.date) !== year || s.amount_chf == null) continue;
      totals.set(s.machine_id, (totals.get(s.machine_id) ?? 0) + Number(s.amount_chf));
    }
    return machines
      .map((m) => ({ ...m, total: totals.get(m.id) ?? 0 }))
      .filter((m) => m.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [serviceCosts, machines, year]);

  const generalThisYear = useMemo(() => general.filter((g) => yearOf(g.date) === year), [general, year]);
  const machinesTotal = perMachine.reduce((s, m) => s + m.total, 0);
  const generalTotal = generalThisYear.reduce((s, g) => s + Number(g.amount_chf), 0);
  const total = machinesTotal + generalTotal;
  const maxMachine = perMachine[0]?.total ?? 0;
  const idx = years.indexOf(year);

  async function remove(g: GeneralCost) {
    if (!window.confirm(t.deleteCostConfirm)) return;
    try {
      await deleteGeneralCost(supabase, g.id);
      setGeneral((prev) => prev.filter((x) => x.id !== g.id));
      router.refresh();
    } catch (e) {
      showToast(t.saveFailed, e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <>
      <ScreenChrome title={t.tCosts} subtitle={t.sCosts} />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Year switcher */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <YearButton disabled={idx <= 0} onClick={() => setYear(years[idx - 1])}>‹</YearButton>
          <div style={{ font: "600 17px/1 var(--font-display)", minWidth: 60, textAlign: "center" }}>{year}</div>
          <YearButton disabled={idx >= years.length - 1} onClick={() => setYear(years[idx + 1])}>›</YearButton>
        </div>

        {/* Headline total */}
        <div style={{ padding: "18px 16px", borderRadius: 12, background: "var(--black)", color: "var(--sheet)" }}>
          <div style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.7 }}>
            {t.totalYear} {year}
          </div>
          <div style={{ marginTop: 10, font: "600 30px/1 var(--font-display)" }}>{formatCHF(total)}</div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Split label={t.machinesCost} value={formatCHF(machinesTotal)} />
            <Split label={t.generalCost} value={formatCHF(generalTotal)} />
          </div>
        </div>

        {/* Per machine */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Heading>{t.costPerMachine}</Heading>
          {perMachine.length === 0 ? (
            <Empty>{t.noMachineCosts}</Empty>
          ) : (
            perMachine.map((m) => (
              <Link
                key={m.id}
                href={`/app/register/${m.asset_tag}`}
                style={{ display: "flex", flexDirection: "column", gap: 6, padding: "11px 13px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)", color: "inherit", textDecoration: "none" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: "600 13px/1.25 var(--font-display)" }}>{m.name}</div>
                    <div style={{ marginTop: 3, font: "400 10.5px/1 var(--font-body)", color: "var(--red)" }}>{m.asset_tag}</div>
                  </div>
                  <div style={{ flex: "none", font: "600 14px/1 var(--font-display)" }}>{formatCHF(m.total)}</div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,.06)" }}>
                  <div style={{ width: `${maxMachine ? (m.total / maxMachine) * 100 : 0}%`, height: "100%", borderRadius: 2, background: "var(--red)" }} />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* General cost centre */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Heading>{t.generalCostCentre}</Heading>
            {generalReady && !adding && (
              <button onClick={() => setAdding(true)} style={linkButton}>
                ＋ {t.addGeneralCost}
              </button>
            )}
          </div>
          {!generalReady ? (
            <Empty>{t.generalNotReady}</Empty>
          ) : (
            <>
              {adding && (
                <GeneralCostForm
                  onCancel={() => setAdding(false)}
                  onSaved={(g) => {
                    setGeneral((prev) => [g, ...prev]);
                    setYear(yearOf(g.date));
                    setAdding(false);
                    showToast(t.costSaved);
                    router.refresh();
                  }}
                  signedInEmail={signedInEmail}
                  personId={personId}
                />
              )}
              {generalThisYear.length === 0 && !adding ? (
                <Empty>{t.noGeneralCosts}</Empty>
              ) : (
                generalThisYear.map((g) => (
                  <div key={g.id} style={{ padding: "11px 13px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                      <div style={{ font: "600 13px/1.3 var(--font-display)", minWidth: 0 }}>{g.description}</div>
                      <div style={{ flex: "none", font: "600 14px/1 var(--font-display)" }}>{formatCHF(g.amount_chf)}</div>
                    </div>
                    <div style={{ marginTop: 5, font: "400 11px/1.3 var(--font-body)", color: "var(--grey-label)" }}>
                      {[formatDate(g.date), g.supplier, g.invoice_number].filter(Boolean).join(" · ")}
                    </div>
                    {g.attachment_path && (
                      <InvoiceAttachment path={g.attachment_path} fileBase={`general_${g.date}_${g.invoice_number || "invoice"}`.replace(/[^\w.-]+/g, "-")} />
                    )}
                    <button onClick={() => remove(g)} style={{ ...linkButton, marginTop: 8, color: "var(--grey-label)", fontSize: 11 }}>
                      {t.deleteCost}
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function GeneralCostForm({
  onCancel,
  onSaved,
  signedInEmail,
  personId,
}: {
  onCancel: () => void;
  onSaved: (g: GeneralCost) => void;
  signedInEmail: string;
  personId: string | null;
}) {
  const { t } = useLang();
  const showToast = useToast();
  const supabase = createClient();
  const [date, setDate] = useState(formatDate(new Date()));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invNo, setInvNo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const parsedAmount = Number(amount.replace(/['’\s]/g, "").replace(",", "."));
  const parsedDate = parseDisplayDate(date);
  const valid = description.trim() !== "" && amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount >= 0 && !!parsedDate;

  async function save() {
    if (!valid || !parsedDate) return;
    setBusy(true);
    try {
      let attachment_path: string | null = null;
      if (file) {
        try {
          attachment_path = await uploadServiceAttachment(supabase, "general", file);
        } catch (e) {
          showToast(t.invoiceUploadFailed, e instanceof Error ? e.message : undefined);
          return;
        }
      }
      const g = await addGeneralCost(supabase, {
        date: toISODate(parsedDate),
        description: description.trim(),
        amount_chf: parsedAmount,
        supplier: supplier || null,
        invoice_number: invNo || null,
        attachment_path,
        logged_by: personId,
        logged_by_name: personId ? null : signedInEmail,
      });
      onSaved(g);
    } catch (e) {
      showToast(t.saveFailed, e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: 14, borderRadius: 11, background: "var(--sheet)", border: "1px dashed rgba(249,49,57,.5)" }}>
      <Field label={t.costDescription}>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.costDescriptionHint} style={field} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9 }}>
        <Field label={t.date}>
          <input value={date} onChange={(e) => setDate(e.target.value)} style={field} />
        </Field>
        <Field label={t.amount}>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={t.amountHint} style={field} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 9 }}>
        <Field label={t.supplier}>
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} style={field} />
        </Field>
        <Field label={t.invoiceNo}>
          <input value={invNo} onChange={(e) => setInvNo(e.target.value)} style={field} />
        </Field>
      </div>
      <label style={{ padding: "10px 12px", borderRadius: 9, border: "1px dashed rgba(0,0,0,.2)", background: "#fff", font: "400 12px/1.3 var(--font-display)", color: "var(--grey-label)", cursor: "pointer", textAlign: "center" }}>
        {file ? file.name : t.attachInvoice}
        <input type="file" accept={ATTACHMENT_ACCEPT} hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <div style={{ display: "flex", gap: 9 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 9, border: "1px solid rgba(0,0,0,.14)", background: "#fff", font: "500 13px/1 var(--font-display)", cursor: "pointer" }}>
          {t.cancel}
        </button>
        <button
          onClick={save}
          disabled={!valid || busy}
          style={{ flex: 2, padding: 12, borderRadius: 9, border: 0, background: "var(--black)", color: "var(--sheet)", font: "600 13px/1 var(--font-display)", cursor: "pointer", opacity: !valid || busy ? 0.5 : 1 }}
        >
          {t.saveCost}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
      <span style={{ font: "400 9.5px/1 var(--font-body)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--grey-label)" }}>{label}</span>
      {children}
    </label>
  );
}

function Split({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "9px 10px", borderRadius: 8, background: "rgba(255,255,255,.1)" }}>
      <div style={{ font: "400 10px/1 var(--font-body)", opacity: 0.7 }}>{label}</div>
      <div style={{ marginTop: 6, font: "600 14px/1 var(--font-display)" }}>{value}</div>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <div style={{ font: "600 11px/1 var(--font-display)", letterSpacing: ".1em", textTransform: "uppercase" }}>{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 14, borderRadius: 10, background: "var(--sheet)", font: "400 12px/1.5 var(--font-body)", color: "var(--grey-text)" }}>{children}</div>;
}

function YearButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ width: 34, height: 34, borderRadius: 999, border: "1px solid rgba(0,0,0,.14)", background: "#fff", font: "500 18px/1 var(--font-display)", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.3 : 1 }}
    >
      {children}
    </button>
  );
}

const linkButton: React.CSSProperties = {
  padding: 0,
  border: 0,
  background: "none",
  font: "500 12px/1 var(--font-display)",
  color: "var(--red)",
  cursor: "pointer",
  textDecoration: "underline",
};

const field: React.CSSProperties = {
  padding: 11,
  border: "1px solid rgba(0,0,0,.14)",
  borderRadius: 9,
  background: "#fff",
  font: "400 13px/1 var(--font-body)",
  outline: "none",
  minWidth: 0,
};
