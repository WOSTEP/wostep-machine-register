"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ScreenChrome } from "@/components/ScreenChrome";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { photoPublicUrl } from "@/lib/data/photos";
import { computeStatus, formatDate, parseISODate, STATUS_COLORS, STATUS_TINT, statusLabel } from "@/lib/status";
import type { MachineSummary } from "@/lib/data/types";
import type { MachineStatus } from "@/lib/status";

type Filter = MachineStatus | null;

export function RegisterClient({
  machines,
  leadDays,
}: {
  machines: MachineSummary[];
  leadDays: number;
}) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(null);

  const withStatus = useMemo(
    () =>
      machines.map((m) => ({
        machine: m,
        status: computeStatus({
          nextDue: parseISODate(m.next_due),
          hasBlockingFault: m.has_blocking_fault,
          leadDays,
        }),
      })),
    [machines, leadDays]
  );

  const counts = useMemo(
    () => ({
      overdue: withStatus.filter((x) => x.status === "overdue").length,
      due: withStatus.filter((x) => x.status === "due").length,
      ok: withStatus.filter((x) => x.status === "ok").length,
    }),
    [withStatus]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withStatus.filter(({ machine: m, status }) => {
      if (filter && status !== filter) return false;
      if (!q) return true;
      const roomName = lang === "EN" ? m.room_name_en : m.room_name_fr;
      return [m.name, m.asset_tag, m.manufacturer, m.inv_ref, roomName]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [withStatus, filter, query, lang]);

  const groups = useMemo(() => {
    const byRoom = new Map<string, { room: string; total: number; items: typeof filtered }>();
    for (const entry of filtered) {
      const roomName = lang === "EN" ? entry.machine.room_name_en : entry.machine.room_name_fr;
      if (!byRoom.has(roomName)) byRoom.set(roomName, { room: roomName, total: 0, items: [] });
      byRoom.get(roomName)!.items.push(entry);
    }
    for (const [roomName, group] of byRoom) {
      group.total = machines.filter(
        (m) => (lang === "EN" ? m.room_name_en : m.room_name_fr) === roomName
      ).length;
    }
    return [...byRoom.values()];
  }, [filtered, machines, lang]);

  function toggleStat(status: MachineStatus) {
    setFilter((prev) => (prev === status ? null : status));
  }

  return (
    <>
      <ScreenChrome title={t.tList} subtitle={`${machines.length} ${t.sList}`} />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatCard
            label={t.overdue}
            n={counts.overdue}
            colors={STATUS_COLORS.overdue}
            active={filter === "overdue"}
            onClick={() => toggleStat("overdue")}
          />
          <StatCard
            label={t.due}
            n={counts.due}
            colors={STATUS_COLORS.due}
            active={filter === "due"}
            onClick={() => toggleStat("due")}
          />
          <StatCard
            label={t.stOk}
            n={counts.ok}
            colors={STATUS_COLORS.ok}
            active={filter === "ok"}
            onClick={() => toggleStat("ok")}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 13px",
            border: "1px solid rgba(0,0,0,.14)",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <span style={{ font: "400 13px/1 var(--font-display)", color: "var(--grey-faint)" }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            style={{
              flex: 1,
              border: 0,
              outline: "none",
              background: "none",
              font: "400 14px/1 var(--font-display)",
              color: "var(--black)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <FilterChip label={t.all} active={filter === null} onClick={() => setFilter(null)} />
          <FilterChip label={t.overdue} active={filter === "overdue"} onClick={() => setFilter("overdue")} />
          <FilterChip label={t.due} active={filter === "due"} onClick={() => setFilter("due")} />
          <FilterChip label={t.fault} active={filter === "fault"} onClick={() => setFilter("fault")} />
        </div>

        {groups.map((g) => (
          <div key={g.room} style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 10,
                paddingBottom: 2,
                borderBottom: "1px solid rgba(0,0,0,.12)",
              }}
            >
              <div
                style={{
                  font: "600 11px/1 var(--font-display)",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--black)",
                }}
              >
                {g.room}
              </div>
              <div style={{ font: "400 10px/1 var(--font-body)", color: "var(--grey-label)" }}>
                {g.items.length} / {g.total}
              </div>
            </div>
            {g.items.map(({ machine: m, status }) => {
              const thumb = m.overview_photo_path ? photoPublicUrl(supabase, m.overview_photo_path) : null;
              const colors = STATUS_COLORS[status];
              return (
                <Link
                  key={m.id}
                  href={`/app/register/${m.asset_tag}`}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "13px 14px",
                    border: "1px solid rgba(0,0,0,.1)",
                    borderLeft: `3px solid ${colors.bg}`,
                    borderRadius: 10,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div
                      style={{
                        flex: "none",
                        width: 46,
                        height: 46,
                        borderRadius: 6,
                        backgroundColor: thumb ? undefined : "var(--sheet)",
                        backgroundImage: thumb ? `url(${thumb})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 15px/1.25 var(--font-display)", color: "var(--black)" }}>
                        {m.name}
                      </div>
                      <div style={{ marginTop: 4, font: "400 11px/1 var(--font-body)", color: "var(--grey-label)" }}>
                        {m.asset_tag}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: "none",
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: STATUS_TINT[status],
                        font: "500 10px/1.3 var(--font-display)",
                        color: colors.bg,
                        textAlign: "center",
                        maxWidth: 96,
                      }}
                    >
                      {statusLabel(status, t)}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      font: "400 11px/1 var(--font-display)",
                      color: "var(--grey-label)",
                    }}
                  >
                    <span>
                      {t.nextService} {formatDate(m.next_due)}
                    </span>
                    <span style={{ fontFamily: "var(--font-body)" }}>{m.interval_months} mo</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

function StatCard({
  label,
  n,
  colors,
  active,
  onClick,
}: {
  label: string;
  n: number;
  colors: { bg: string; fg: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "12px 10px",
        borderRadius: 10,
        background: colors.bg,
        border: active ? "1px solid rgba(0,0,0,.4)" : "1px solid transparent",
        boxShadow: active ? "0 0 0 2px #000000" : "none",
        cursor: "pointer",
      }}
    >
      <div style={{ font: "600 24px/1 var(--font-display)", color: colors.fg }}>{n}</div>
      <div style={{ marginTop: 5, font: "500 10px/1.2 var(--font-display)", color: colors.fg, opacity: 0.8 }}>
        {label}
      </div>
    </button>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 12px",
        border: active ? "1px solid var(--black)" : "1px solid rgba(0,0,0,.14)",
        borderRadius: 999,
        background: active ? "var(--black)" : "#fff",
        color: active ? "#fff" : "var(--black)",
        font: "500 12px/1 var(--font-display)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
