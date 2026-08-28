"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";

const TABS = [
  { href: "/app/register", icon: "▦", key: "machines" as const },
  { href: "/app/alarms", icon: "◷", key: "alarms" as const },
  { href: "/app/add", icon: "＋", key: "add" as const },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();

  return (
    <div
      className="screen-tabbar"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        padding: "9px 8px calc(14px + env(safe-area-inset-bottom))",
        background: "var(--sheet)",
        borderTop: "1px solid rgba(0,0,0,.1)",
      }}
    >
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              padding: "6px 2px",
              border: 0,
              background: "none",
              cursor: "pointer",
              color: active ? "var(--red)" : "var(--grey-faint)",
            }}
          >
            <span style={{ font: "400 17px/1 var(--font-display)" }}>{tab.icon}</span>
            <span style={{ font: "500 10px/1 var(--font-display)" }}>
              {tab.key === "machines" ? t.machines : tab.key === "alarms" ? t.alarms : t.add}
            </span>
          </button>
        );
      })}
    </div>
  );
}
