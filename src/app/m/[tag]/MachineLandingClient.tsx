"use client";

import Image from "next/image";
import Link from "next/link";
import { ScreenShell } from "@/components/ScreenShell";
import { QRCodeTile } from "@/components/QRCode";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { photoPublicUrl } from "@/lib/data/photos";
import type { MachineSummary } from "@/lib/data/types";

export function MachineLandingClient({ machine }: { machine: MachineSummary }) {
  const { t, lang } = useLang();
  const roomName = lang === "EN" ? machine.room_name_en : machine.room_name_fr;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const supabase = createClient();
  const thumbUrl = machine.overview_photo_path
    ? photoPublicUrl(supabase, machine.overview_photo_path)
    : null;

  return (
    <ScreenShell background="#ffffff">
      <div
        style={{
          padding: "calc(66px + env(safe-area-inset-top)) 24px 32px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Image src="/logo-wostep.png" alt="Fondation WOSTEP" width={88} height={88} />
          <div
            style={{
              font: "500 10px/1 var(--font-display)",
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "var(--grey-label)",
            }}
          >
            {t.appName}
          </div>
        </div>

        {thumbUrl && (
          <div
            style={{
              marginTop: 26,
              width: "100%",
              height: 160,
              borderRadius: 12,
              backgroundImage: `url(${thumbUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        <div
          style={{
            marginTop: thumbUrl ? 14 : 26,
            padding: 16,
            borderRadius: 12,
            background: "var(--sheet)",
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <QRCodeTile value={`${origin}/m/${machine.asset_tag}`} size={58} />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "400 10.5px/1 var(--font-body)", color: "var(--red)" }}>
              {machine.asset_tag}
            </div>
            <div style={{ marginTop: 5, font: "600 18px/1.15 var(--font-display)", color: "var(--black)" }}>
              {machine.name}
            </div>
            <div style={{ marginTop: 5, font: "400 11px/1 var(--font-body)", color: "var(--grey-text)" }}>
              {roomName}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <ActionLink href={`/m/${machine.asset_tag}/photos`} variant="black">
            {t.tPhotos}
          </ActionLink>
          <ActionLink href={`/m/${machine.asset_tag}/fault`} variant="red">
            {t.tFault}
          </ActionLink>
          <ActionLink href="/signin" variant="grey">
            {t.staffSignin}
          </ActionLink>
        </div>

        <div style={{ marginTop: 14, font: "400 11px/1.5 var(--font-body)", color: "var(--grey-label)" }}>
          {t.landingNote}
        </div>

        <Link
          href="/scan"
          style={{
            marginTop: 22,
            alignSelf: "flex-start",
            font: "500 12px/1 var(--font-display)",
            color: "var(--red)",
          }}
        >
          ← {t.chooseAnother}
        </Link>
      </div>
    </ScreenShell>
  );
}

function ActionLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "black" | "red" | "grey";
  children: React.ReactNode;
}) {
  const styles = {
    black: { background: "var(--black)", color: "#ffffff", border: "none" },
    red: { background: "#ffffff", color: "var(--red)", border: "1px solid var(--red)" },
    grey: { background: "#ffffff", color: "var(--black)", border: "1px solid rgba(0,0,0,.18)" },
  }[variant];

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "17px 18px",
        borderRadius: 11,
        font: "600 15px/1 var(--font-display)",
        ...styles,
      }}
    >
      {children}
      <span style={{ font: "400 16px/1 var(--font-body)" }}>→</span>
    </Link>
  );
}
