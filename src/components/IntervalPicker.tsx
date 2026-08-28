"use client";

import { useLang } from "@/lib/i18n/LangProvider";
import { INTERVAL_OPTIONS } from "@/lib/labels";

export function IntervalPicker({
  value,
  onChange,
  note,
}: {
  value: number;
  onChange: (n: number) => void;
  note?: string;
}) {
  const { t } = useLang();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={{ font: "500 10px/1 var(--font-body)", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--grey-label)" }}>
        {t.interval}
      </span>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {INTERVAL_OPTIONS.map((n) => {
          const active = n === value;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
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
              {n} mo
            </button>
          );
        })}
      </div>
      {note && <div style={{ font: "400 11px/1.45 var(--font-body)", color: "var(--grey-label)" }}>{note}</div>}
    </div>
  );
}
