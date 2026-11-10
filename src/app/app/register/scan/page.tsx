"use client";

import { QrScanScreen } from "@/components/QrScanScreen";
import { useLang } from "@/lib/i18n/LangProvider";

export default function StaffScanPage() {
  const { t } = useLang();
  return <QrScanScreen backHref="/app/register" backLabel={t.tList} machineHref={(tag) => `/app/register/${tag}`} />;
}
