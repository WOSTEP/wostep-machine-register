"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScreenShell } from "@/components/ScreenShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { listMachineSummaries } from "@/lib/data/machines";
import { photoPublicUrl } from "@/lib/data/photos";
import type { MachineSummary } from "@/lib/data/types";

export default function ScanPage() {
  const { t } = useLang();
  const [machines, setMachines] = useState<MachineSummary[] | null>(null);
  const supabase = createClient();

  useEffect(() => {
    listMachineSummaries(supabase).then(setMachines).catch(() => setMachines([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenShell background="#1a1a1a">
      <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 0" }}>
        <Link
          href="/"
          style={{ font: "500 12px/1 var(--font-display)", color: "rgba(239,239,237,.55)" }}
        >
          ← {t.tWelcome}
        </Link>
      </div>

      <div
        style={{
          position: "relative",
          height: 322,
          marginTop: 14,
          background: "var(--panel-dark)",
          overflow: "hidden",
          flex: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(115deg, rgba(255,255,255,.03) 0 14px, transparent 14px 30px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 198,
            height: 198,
          }}
        >
          {[
            { top: 0, left: 0, br: "4px 0 0 0", bl: true, bt: true },
            { top: 0, right: 0, br: "0 4px 0 0", bt: true, brdr: true },
            { bottom: 0, left: 0, br: "0 0 0 4px", bl: true, bb: true },
            { bottom: 0, right: 0, br: "0 0 4px 0", bb: true, brdr: true },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: c.top,
                left: c.left,
                right: c.right,
                bottom: c.bottom,
                width: 32,
                height: 32,
                borderRadius: c.br,
                borderLeft: c.bl ? "2px solid #efefed" : undefined,
                borderRight: c.brdr ? "2px solid #efefed" : undefined,
                borderTop: c.bt ? "2px solid #efefed" : undefined,
                borderBottom: c.bb ? "2px solid #efefed" : undefined,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              top: "50%",
              height: 1,
              background: "var(--red)",
              boxShadow: "0 0 12px rgba(249,49,57,.9)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 20,
            textAlign: "center",
            font: "400 12px/1.4 var(--font-body)",
            color: "rgba(239,239,237,.6)",
            padding: "0 32px",
          }}
        >
          {t.scanPrompt}
        </div>
      </div>

      <div style={{ padding: "22px 16px calc(28px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 11 }}>
        <div
          style={{
            font: "500 10px/1 var(--font-display)",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "rgba(239,239,237,.45)",
          }}
        >
          {t.orSelect}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            borderRadius: 10,
            overflow: "hidden",
            background: "rgba(255,255,255,.05)",
          }}
        >
          {(machines ?? []).map((m) => {
            const thumb = m.overview_photo_path ? photoPublicUrl(supabase, m.overview_photo_path) : null;
            return (
              <Link
                key={m.id}
                href={`/m/${m.asset_tag}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "11px 14px",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    flex: "none",
                    width: 42,
                    height: 42,
                    borderRadius: 6,
                    overflow: "hidden",
                    backgroundColor: thumb ? undefined : "rgba(255,255,255,.09)",
                    backgroundImage: thumb ? `url(${thumb})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", font: "500 14px/1.2 var(--font-display)", color: "#efefed" }}>
                    {m.name}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      font: "400 10.5px/1 var(--font-body)",
                      color: "rgba(239,239,237,.45)",
                    }}
                  >
                    {m.asset_tag} · {m.room_name_en}
                  </span>
                </span>
                <span style={{ flex: "none", font: "400 15px/1 var(--font-body)", color: "rgba(239,239,237,.35)" }}>
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </ScreenShell>
  );
}
