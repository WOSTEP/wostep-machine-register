"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ScreenShell } from "@/components/ScreenShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { guestSignIn, type GuestSignInState } from "./actions";

const initialState: GuestSignInState = { error: false };

export function VisitorSignInClient({ next }: { next: string }) {
  const { t } = useLang();
  const [state, formAction, pending] = useActionState(guestSignIn, initialState);

  return (
    <ScreenShell background="#ffffff">
      <form
        action={formAction}
        style={{
          flex: 1,
          boxSizing: "border-box",
          padding: "calc(74px + env(safe-area-inset-top)) 28px 40px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <input type="hidden" name="next" value={next} />

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
          {t.visitorAccessTitle}
        </div>
        <div
          style={{
            marginTop: 9,
            textAlign: "center",
            font: "400 13px/1.5 var(--font-body)",
            color: "var(--grey-text)",
          }}
        >
          {t.visitorAccessSub}
        </div>

        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <FieldLabel>{t.username}</FieldLabel>
            <input name="username" required autoComplete="username" style={fieldStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <FieldLabel>{t.password}</FieldLabel>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              style={fieldStyle}
            />
          </label>

          {state.error && (
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
              {t.invalidGuestCredentials}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: 6,
              padding: 15,
              border: 0,
              borderRadius: 9,
              background: "var(--black)",
              color: "#fff",
              font: "600 14px/1 var(--font-display)",
              cursor: "pointer",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {t.visitorBtn}
          </button>
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
