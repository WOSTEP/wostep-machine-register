"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LangProvider";

export function ScreenChrome({
  title,
  subtitle,
  backHref,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const { lang, toggleLang } = useLang();

  return (
    <div
      className="screen-chrome"
      style={{
        padding: "calc(20px + env(safe-area-inset-top)) 20px 12px",
        background: "var(--sheet)",
        borderBottom: "1px solid rgba(0,0,0,.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          {backHref && (
            <Link
              href={backHref}
              style={{
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: 5,
                margin: "0 0 2px",
                color: "var(--red)",
                font: "500 12px/1 var(--font-display)",
              }}
            >
              ← {backLabel}
            </Link>
          )}
          <div
            style={{
              font: "600 24px/1.15 var(--font-display)",
              letterSpacing: "-.02em",
              color: "var(--black)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ font: "400 12px/1.3 var(--font-display)", color: "var(--grey-label)" }}>
              {subtitle}
            </div>
          )}
        </div>
        <button
          onClick={toggleLang}
          style={{
            flex: "none",
            marginTop: 2,
            padding: "6px 10px",
            border: "1px solid rgba(0,0,0,.16)",
            borderRadius: 999,
            background: "#fff",
            font: "500 11px/1 var(--font-body)",
            letterSpacing: ".06em",
            color: "var(--black)",
            cursor: "pointer",
          }}
        >
          {lang}
        </button>
      </div>
    </div>
  );
}
