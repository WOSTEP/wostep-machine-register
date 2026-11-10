"use client";

import { ScreenShell } from "@/components/ScreenShell";
import { QrScanScreen } from "@/components/QrScanScreen";
import { useLang } from "@/lib/i18n/LangProvider";

export default function ScanPage() {
  const { t } = useLang();
  return (
    <ScreenShell background="#1a1a1a">
      <QrScanScreen backHref="/" backLabel={t.tWelcome} machineHref={(tag) => `/m/${encodeURIComponent(tag)}`} />
    </ScreenShell>
  );
}
