"use client";

import { useEffect } from "react";
import { ScreenShell } from "@/components/ScreenShell";
import { LangProvider, useLang } from "@/lib/i18n/LangProvider";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <LangProvider>
      <ErrorBody reset={reset} />
    </LangProvider>
  );
}

function ErrorBody({ reset }: { reset: () => void }) {
  const { t } = useLang();
  return (
    <ScreenShell background="#ffffff">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ font: "600 19px/1.2 var(--font-display)" }}>{t.genericError}</div>
        <button
          onClick={reset}
          style={{
            padding: "12px 20px",
            border: 0,
            borderRadius: 9,
            background: "var(--black)",
            color: "var(--sheet)",
            font: "600 13px/1 var(--font-display)",
            cursor: "pointer",
          }}
        >
          ↻
        </button>
      </div>
    </ScreenShell>
  );
}
