"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScreenShell } from "@/components/ScreenShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { signIn } from "@/lib/auth";

export default function SignInPage() {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<"domain" | "invalid" | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn(email, pwd);
    setBusy(false);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    router.push(params.get("next") ?? "/app/register");
    router.refresh();
  }

  return (
    <ScreenShell background="#ffffff">
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          boxSizing: "border-box",
          padding: "calc(74px + env(safe-area-inset-top)) 28px 40px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Image src="/logo-wostep.png" alt="Fondation WOSTEP" width={230} height={55} />
          <div style={{ width: 34, height: 2, background: "var(--red)" }} />
        </div>

        <Link
          href="/"
          style={{
            alignSelf: "center",
            marginTop: 18,
            font: "500 12px/1 var(--font-display)",
            color: "var(--grey-label)",
          }}
        >
          ← {t.tWelcome}
        </Link>

        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            font: "500 26px/1.15 var(--font-display)",
            letterSpacing: "-.01em",
            color: "var(--black)",
          }}
        >
          {t.signinTitle}
        </div>
        <div
          style={{
            marginTop: 9,
            textAlign: "center",
            font: "400 13px/1.5 var(--font-body)",
            color: "var(--grey-text)",
          }}
        >
          {t.signinSub}
        </div>

        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <FieldLabel>{t.email}</FieldLabel>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@wostep.ch"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <FieldLabel>{t.password}</FieldLabel>
            <input
              type="password"
              required
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="••••••••"
              style={fieldStyle}
            />
          </label>

          {error && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 4,
                background: "var(--red-tint)",
                border: "1px solid var(--red)",
                font: "400 12px/1.4 var(--font-body)",
                color: "var(--red-dark)",
              }}
            >
              {error === "domain" ? t.domainError : t.invalidCredentials}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: 6,
              padding: 15,
              border: 0,
              borderRadius: 9,
              background: "var(--red)",
              color: "#fff",
              font: "600 14px/1 var(--font-display)",
              cursor: "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {t.signin}
          </button>
          <div style={{ textAlign: "center", font: "400 12px/1 var(--font-body)", color: "var(--grey-label)" }}>
            {t.forgot}
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 32,
            textAlign: "center",
            font: "400 11px/1.5 var(--font-body)",
            color: "var(--grey-faint)",
          }}
        >
          {t.restricted}
        </div>
      </form>
    </ScreenShell>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        font: "500 10px/1 var(--font-display)",
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "var(--grey-label)",
      }}
    >
      {children}
    </span>
  );
}

const fieldStyle: React.CSSProperties = {
  padding: 14,
  border: "1px solid var(--border-input)",
  borderRadius: 4,
  background: "var(--sheet)",
  color: "var(--black)",
  font: "400 15px/1 var(--font-body)",
  outline: "none",
};
