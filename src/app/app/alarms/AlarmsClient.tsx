"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenChrome } from "@/components/ScreenChrome";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { addPerson, setReceivesDueReminders } from "@/lib/data/people";
import { setDueLeadDays } from "@/lib/data/settings";
import { addDays, formatDate, parseISODate } from "@/lib/status";
import { fillTemplate, isStaffEmail, LEAD_OPTIONS, roleLabel } from "@/lib/labels";
import type { MachineSummary, Person, Settings } from "@/lib/data/types";

export function AlarmsClient({
  machines,
  initialPeople,
  initialSettings,
}: {
  machines: MachineSummary[];
  initialPeople: Person[];
  initialSettings: Settings;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const supabase = createClient();

  const [people, setPeople] = useState(initialPeople);
  const [leadDays, setLeadDays] = useState(initialSettings.due_lead_days);
  const [addingPerson, setAddingPerson] = useState(false);
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [personError, setPersonError] = useState(false);

  const activeRecipients = useMemo(() => people.filter((p) => p.receives_due_reminders), [people]);

  const queue = useMemo(
    () =>
      machines
        .filter((m) => m.next_due)
        .sort((a, b) => (a.next_due! < b.next_due! ? -1 : 1))
        .slice(0, 4),
    [machines]
  );

  const [now] = useState(() => Date.now());

  const previewMachine = queue[0] ?? null;
  const previewIsOverdue = previewMachine
    ? (parseISODate(previewMachine.next_due)?.getTime() ?? 0) < now
    : false;

  const subjectLine = previewMachine
    ? fillTemplate(previewIsOverdue ? t.emailSubjectOverdue : t.emailSubjectDue, {
        days: leadDays,
        name: previewMachine.name,
        tag: previewMachine.asset_tag,
      })
    : "";

  const bodyLine = previewMachine
    ? [
        fillTemplate(t.emailIntro, {
          months: previewMachine.interval_months,
          name: previewMachine.name,
          tag: previewMachine.asset_tag,
          room: lang === "EN" ? previewMachine.room_name_en : previewMachine.room_name_fr,
          date: formatDate(previewMachine.next_due),
        }),
        "",
        fillTemplate(t.emailInvRef, { value: previewMachine.inv_ref ?? "—" }),
        fillTemplate(t.emailLastService, { value: formatDate(previewMachine.last_service) }),
        "",
        t.emailFooter,
      ].join("\n")
    : "";

  async function toggleRecipient(person: Person) {
    const updated = await setReceivesDueReminders(supabase, person.id, !person.receives_due_reminders);
    setPeople((prev) => prev.map((p) => (p.id === person.id ? updated : p)));
  }

  async function confirmAddPerson() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(pEmail)) {
      setPersonError(true);
      return;
    }
    const person = await addPerson(supabase, { name: pName.trim(), email: pEmail.trim() });
    setPeople((prev) => [...prev, person]);
    setPName("");
    setPEmail("");
    setAddingPerson(false);
    setPersonError(false);
  }

  async function pickLead(n: number) {
    setLeadDays(n);
    await setDueLeadDays(supabase, n);
    router.refresh();
  }

  return (
    <>
      <ScreenChrome title={t.tAlarms} subtitle={t.sAlarms} backHref="/app/register" backLabel={t.tList} />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <SectionHeading>{t.rules}</SectionHeading>
          <RuleCard tone="var(--yellow)" label={t.ruleDue} who={t.toRecipients} text={t.ruleDueText} />
          <RuleCard tone="var(--green)" label={t.ruleDone} who={t.toDirector} text={t.ruleDoneText} />
          <RuleCard tone="var(--red)" label={t.ruleLate} who={t.toDirector} text={t.ruleLateText} />
        </div>

        <div style={{ padding: 15, borderRadius: 12, background: "var(--black)" }}>
          <div style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(239,239,237,.5)" }}>
            {t.leadTime}
          </div>
          <div style={{ marginTop: 9, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LEAD_OPTIONS.map((n) => {
              const active = n === leadDays;
              return (
                <button
                  key={n}
                  onClick={() => pickLead(n)}
                  style={{
                    padding: "8px 12px",
                    border: active ? "1px solid #fff" : "1px solid rgba(255,255,255,.3)",
                    borderRadius: 999,
                    background: active ? "#fff" : "none",
                    color: active ? "#000" : "#efefed",
                    font: "500 12px/1 var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  {n} d
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 12, font: "400 11px/1.5 var(--font-body)", color: "rgba(239,239,237,.5)" }}>
            {t.leadNote}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionHeading>{t.recipients}</SectionHeading>
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleRecipient(p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 13px",
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "#fff",
                textAlign: "left",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  border: p.receives_due_reminders ? "1px solid var(--red)" : "1px solid rgba(0,0,0,.2)",
                  background: p.receives_due_reminders ? "var(--red)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "600 11px/1 var(--font-display)",
                  color: "#fff",
                }}
              >
                {p.receives_due_reminders ? "✓" : ""}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", font: "500 13px/1.2 var(--font-display)", color: "var(--black)" }}>
                  {p.name}
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: 3,
                    font: "400 11px/1 var(--font-body)",
                    color: "var(--grey-label)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.email}
                </span>
              </span>
              <span style={{ flex: "none", font: "400 10px/1 var(--font-display)", color: "var(--grey-faint)" }}>
                {isStaffEmail(p.email) ? roleLabel(p.role, t) : t.roleExternal}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: 14, borderRadius: 10, background: "var(--sheet)", border: "1px dashed rgba(0,0,0,.2)" }}>
          {addingPerson && (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <SmallLabel>{t.personName}</SmallLabel>
                <input value={pName} onChange={(e) => setPName(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <SmallLabel>{t.personEmail}</SmallLabel>
                <input value={pEmail} onChange={(e) => setPEmail(e.target.value)} placeholder="prenom.nom@wostep.ch" style={inputStyle} />
              </label>
              {personError && <span style={{ font: "400 11px/1.4 var(--font-body)", color: "var(--red-dark)" }}>{t.emailInvalid}</span>}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
                <button onClick={confirmAddPerson} style={{ padding: 12, border: 0, borderRadius: 9, background: "var(--black)", color: "var(--sheet)", font: "600 13px/1 var(--font-display)", cursor: "pointer" }}>
                  {t.addBtn}
                </button>
                <button onClick={() => setAddingPerson(false)} style={{ padding: 12, border: "1px solid rgba(0,0,0,.16)", borderRadius: 9, background: "#fff", color: "#4a4b4d", font: "500 13px/1 var(--font-display)", cursor: "pointer" }}>
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
          {!addingPerson && (
            <button
              onClick={() => setAddingPerson(true)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 13, border: 0, borderRadius: 9, background: "var(--red)", color: "#fff", font: "600 13px/1 var(--font-display)", cursor: "pointer" }}
            >
              ＋ {t.addPerson}
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionHeading>{t.emailPreview}</SectionHeading>
          {previewMachine ? (
            <div style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 11, background: "#fff", overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,.08)", background: "var(--sheet-warm)" }}>
                <div style={{ font: "400 11px/1.6 var(--font-body)", color: "var(--grey-label)" }}>
                  {t.from} {initialSettings.sending_address}
                </div>
                <div style={{ font: "400 11px/1.6 var(--font-body)", color: "var(--grey-label)" }}>
                  {t.to} {activeRecipients.map((r) => r.email).join(", ") || "—"}
                </div>
                <div style={{ marginTop: 5, font: "600 13px/1.35 var(--font-display)", color: "var(--black)" }}>{subjectLine}</div>
              </div>
              <div style={{ padding: 14, font: "400 12px/1.6 var(--font-display)", color: "#4a4b4d", whiteSpace: "pre-line" }}>
                {bodyLine}
              </div>
              <div style={{ padding: "0 14px 16px" }}>
                <span style={{ display: "inline-block", padding: "10px 14px", borderRadius: 8, background: "var(--red)", color: "#fff", font: "600 12px/1 var(--font-display)" }}>
                  {t.openRecord}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: 14, borderRadius: 10, background: "var(--sheet)", font: "400 12px/1.5 var(--font-body)", color: "var(--grey-text)" }}>
              {t.noMachines}
            </div>
          )}
          <div style={{ font: "400 11px/1.5 var(--font-display)", color: "var(--grey-label)" }}>{t.emailNote}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionHeading>{t.queue}</SectionHeading>
          {queue.map((m) => {
            const due = parseISODate(m.next_due);
            const overdue = due ? due.getTime() < now : false;
            const label = overdue
              ? fillTemplate(t.overdueByDays, {
                  n: Math.abs(Math.floor((due!.getTime() - now) / 86_400_000)),
                })
              : fillTemplate(t.queueFires, { date: formatDate(due ? addDays(due, -leadDays) : null) });
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "11px 13px",
                  borderRadius: 9,
                  background: "#fff",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "500 13px/1.2 var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.name}
                  </div>
                  <div style={{ marginTop: 3, font: "400 10px/1 var(--font-body)", color: "var(--grey-label)" }}>{m.asset_tag}</div>
                </div>
                <div style={{ flex: "none", font: "500 11px/1.3 var(--font-display)", color: overdue ? "var(--red)" : "var(--black)", textAlign: "right" }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
          style={{
            alignSelf: "center",
            marginTop: 8,
            padding: 0,
            border: 0,
            background: "none",
            font: "500 12px/1 var(--font-display)",
            color: "var(--grey-label)",
            cursor: "pointer",
          }}
        >
          {t.signOut}
        </button>
      </div>
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ font: "600 11px/1 var(--font-display)", letterSpacing: ".1em", textTransform: "uppercase" }}>
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

function RuleCard({ tone, label, who, text }: { tone: string; label: string; who: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "13px 14px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)" }}>
      <div style={{ flex: "none", width: 4, borderRadius: 2, background: tone }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <span style={{ font: "600 13px/1.2 var(--font-display)", color: "var(--black)" }}>{label}</span>
          <span style={{ flex: "none", font: "400 10px/1 var(--font-body)", color: "var(--grey-label)" }}>{who}</span>
        </div>
        <div style={{ marginTop: 6, font: "400 11.5px/1.5 var(--font-body)", color: "var(--grey-text)" }}>{text}</div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 12,
  border: "1px solid rgba(0,0,0,.16)",
  borderRadius: 9,
  background: "#ffffff",
  font: "400 14px/1 var(--font-body)",
  outline: "none",
};
