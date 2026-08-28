"use client";

import Image from "next/image";
import Link from "next/link";
import { ScreenShell } from "@/components/ScreenShell";
import { useLang } from "@/lib/i18n/LangProvider";

export default function WelcomePage() {
  const { t, lang, toggleLang } = useLang();

  return (
    <ScreenShell background="#ffffff">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          padding: "70px 28px 24px",
        }}
      >
        <Image src="/logo-wostep.png" alt="Fondation WOSTEP" width={126} height={126} priority />
        <div style={{ width: 34, height: 2, background: "var(--red)" }} />
        <div
          style={{
            textAlign: "center",
            font: "500 24px/1.2 var(--font-display)",
            letterSpacing: "-.01em",
            color: "var(--black)",
          }}
        >
          {t.appName}
        </div>
        <div
          style={{
            maxWidth: 270,
            textAlign: "center",
            font: "400 13px/1.5 var(--font-body)",
            color: "var(--grey-text)",
          }}
        >
          {t.welcomeSub}
        </div>
      </div>

      <div
        style={{
          flex: "none",
          padding: "0 24px calc(40px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          gap: 11,
        }}
      >
        <Link
          href="/scan"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            padding: "18px 20px",
            borderRadius: 11,
            background: "var(--black)",
            textAlign: "left",
          }}
        >
          <span style={{ font: "600 16px/1 var(--font-display)", color: "#ffffff" }}>
            {t.visitorBtn}
          </span>
          <span style={{ font: "400 11.5px/1.35 var(--font-body)", color: "rgba(255,255,255,.6)" }}>
            {t.visitorSub}
          </span>
        </Link>
        <Link
          href="/signin"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            padding: "18px 20px",
            border: "1px solid rgba(0,0,0,.18)",
            borderRadius: 11,
            background: "#ffffff",
            textAlign: "left",
          }}
        >
          <span style={{ font: "600 16px/1 var(--font-display)", color: "var(--black)" }}>
            {t.staffBtn}
          </span>
          <span style={{ font: "400 11.5px/1.35 var(--font-body)", color: "var(--grey-label)" }}>
            {t.staffSub}
          </span>
        </Link>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 6 }}>
          <button
            onClick={toggleLang}
            style={{
              padding: "7px 13px",
              border: "1px solid rgba(0,0,0,.14)",
              borderRadius: 999,
              background: "#ffffff",
              font: "500 11px/1 var(--font-body)",
              letterSpacing: ".06em",
              color: "var(--grey-text)",
              cursor: "pointer",
            }}
          >
            {lang}
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
