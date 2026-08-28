"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell } from "@/components/ScreenShell";
import { ScreenChrome } from "@/components/ScreenChrome";
import { TabBar } from "@/components/TabBar";
import { useLang } from "@/lib/i18n/LangProvider";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import { photoPublicUrl } from "@/lib/data/photos";
import { reportFault, uploadFaultPhoto } from "@/lib/data/faults";
import { downscaleToWebp } from "@/lib/image";
import { SEVERITIES, SEVERITY_DOT, severityLabel } from "@/lib/labels";
import type { MachineSummary, Person } from "@/lib/data/types";
import type { FaultSeverity } from "@/lib/supabase/types";

export function FaultClient({
  machine,
  isStaff,
  people,
}: {
  machine: MachineSummary;
  isStaff: boolean;
  people: Person[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const showToast = useToast();
  const supabase = createClient();

  const [severity, setSeverity] = useState<FaultSeverity>("partial");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const recipients = useMemo(
    () =>
      people.filter(
        (p) =>
          p.receives_fault_reports &&
          (p.role === "instructor" || (p.role === "director" && severity === "blocking"))
      ),
    [people, severity]
  );

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setBusy(true);
    try {
      const photoPath = file ? await uploadFaultPhoto(supabase, await downscaleToWebp(file)) : null;
      await reportFault(supabase, {
        machine_id: machine.id,
        reporter_name: name.trim(),
        severity,
        description: description.trim() || null,
        photo_path: photoPath,
      });
      showToast(t.faultTitle, isStaff ? undefined : t.faultBody);
      router.push(isStaff ? `/app/register/${machine.asset_tag}` : `/m/${machine.asset_tag}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell background="#ffffff">
      <ScreenChrome
        title={t.tFault}
        subtitle={t.sFault}
        backHref={isStaff ? `/app/register/${machine.asset_tag}` : `/m/${machine.asset_tag}`}
        backLabel={t.back}
      />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 10,
            background: "#fff",
            border: "1px solid var(--border)",
          }}
        >
          {machine.overview_photo_path && (
            <div
              style={{
                flex: "none",
                width: 46,
                height: 46,
                borderRadius: 6,
                backgroundImage: `url(${photoPublicUrl(supabase, machine.overview_photo_path)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
          <div>
            <div style={{ font: "400 11px/1 var(--font-body)", color: "var(--red)" }}>{machine.asset_tag}</div>
            <div style={{ marginTop: 4, font: "600 15px/1.2 var(--font-display)" }}>{machine.name}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <Label>{t.severity}</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: 13,
                  borderRadius: 10,
                  border: severity === s ? "1px solid var(--red)" : "1px solid var(--border)",
                  background: severity === s ? "var(--red-tint)" : "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    flex: "none",
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: SEVERITY_DOT[s],
                  }}
                />
                <span style={{ font: "600 13px/1 var(--font-display)", color: "var(--black)" }}>
                  {severityLabel(s, t)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>{t.yourName}</Label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError(false);
            }}
            placeholder={t.yourNameHint}
            style={fieldStyle}
          />
          {nameError && (
            <span style={{ font: "400 11px/1.4 var(--font-body)", color: "var(--red-dark)" }}>
              {t.nameRequired}
            </span>
          )}
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>{t.whatHappened}</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.faultHint}
            style={{ ...fieldStyle, height: 96, resize: "none", fontFamily: "var(--font-display)" }}
          />
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <Label>{t.photo}</Label>
          <label
            style={{
              height: 104,
              border: "1px dashed rgba(0,0,0,.24)",
              borderRadius: 10,
              background: "var(--sheet)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "400 12px/1 var(--font-display)",
              color: "var(--grey-label)",
              cursor: "pointer",
            }}
          >
            {file ? file.name : t.photoHint}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {isStaff && (
          <div style={{ padding: "13px 14px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)" }}>
            <Label>{t.notifies}</Label>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              {recipients.map((r) => (
                <div key={r.id} style={{ font: "400 12px/1.4 var(--font-body)", color: "var(--black)" }}>
                  {r.email}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 9, font: "400 11px/1.45 var(--font-body)", color: "var(--grey-label)" }}>
              {severity === "blocking" ? t.machineOutOfService : t.faultRuleNormal}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={busy}
          style={{
            padding: 15,
            border: 0,
            borderRadius: 10,
            background: "var(--red)",
            color: "#fff",
            font: "600 14px/1 var(--font-display)",
            cursor: "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {t.sendReport}
        </button>
      </div>
      {isStaff && <TabBar />}
    </ScreenShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        font: "500 10px/1 var(--font-body)",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--grey-label)",
      }}
    >
      {children}
    </span>
  );
}

const fieldStyle: React.CSSProperties = {
  padding: 12,
  border: "1px solid var(--border-input-alt)",
  borderRadius: 9,
  background: "#fff",
  font: "400 14px/1 var(--font-body)",
  outline: "none",
};
