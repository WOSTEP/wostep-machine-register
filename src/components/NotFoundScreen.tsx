"use client";

import Link from "next/link";
import { ScreenShell } from "./ScreenShell";
import { useLang } from "@/lib/i18n/LangProvider";

export function NotFoundScreen() {
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
          gap: 10,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ font: "600 19px/1.2 var(--font-display)" }}>{t.notFound}</div>
        <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--grey-text)" }}>
          {t.notFoundBody}
        </div>
        <Link
          href="/scan"
          style={{ marginTop: 12, font: "500 13px/1 var(--font-display)", color: "var(--red)" }}
        >
          ← {t.chooseAnother}
        </Link>
      </div>
    </ScreenShell>
  );
}
