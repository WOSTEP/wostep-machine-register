"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScreenChrome } from "@/components/ScreenChrome";
import { PhotoSlot } from "@/components/PhotoSlot";
import { QRCodeTile } from "@/components/QRCode";
import { DownloadQrButton } from "@/components/DownloadQrButton";
import { useLang } from "@/lib/i18n/LangProvider";
import { createClient } from "@/lib/supabase/client";
import { photoPublicUrl } from "@/lib/data/photos";
import { resolveFault } from "@/lib/data/faults";
import {
  computeStatus,
  formatDate,
  parseISODate,
  statusLongLabel,
  STATUS_COLORS,
  STATUS_TINT,
} from "@/lib/status";
import { workTypeLabel, severityLabel } from "@/lib/labels";
import type { Fault, MachineSummary, Photo, Service } from "@/lib/data/types";

export function MachineRecordClient({
  machine,
  services,
  photos,
  faults,
  leadDays,
  recipientCount,
}: {
  machine: MachineSummary;
  services: Service[];
  photos: Photo[];
  faults: Fault[];
  leadDays: number;
  recipientCount: number;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const supabase = createClient();
  const [overview, setOverview] = useState(photos.find((p) => p.is_overview) ?? null);
  const [openFaults, setOpenFaults] = useState(faults.filter((f) => !f.resolved_at));

  const roomName = lang === "EN" ? machine.room_name_en : machine.room_name_fr;
  const status = computeStatus({
    nextDue: parseISODate(machine.next_due),
    hasBlockingFault: openFaults.length > 0,
    leadDays,
  });
  const colors = STATUS_COLORS[status];
  const otherPhotos = useMemo(() => photos.filter((p) => !p.is_overview), [photos]);

  const specs: [string, string][] = [
    [t.fInv, machine.inv_ref ?? "—"],
    [t.fMaker, machine.manufacturer ?? "—"],
    [t.fSerial, machine.serial ?? "—"],
    [t.fYear, machine.year ?? "—"],
    [t.room, roomName],
    [t.interval, `${machine.interval_months} mo`],
    [t.recipients, String(recipientCount)],
  ];

  async function markResolved(id: string) {
    await resolveFault(supabase, id);
    setOpenFaults((prev) => prev.filter((f) => f.id !== id));
    router.refresh();
  }

  return (
    <>
      <ScreenChrome title={machine.name} subtitle={machine.asset_tag} backHref="/app/register" backLabel={t.tList} />
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ borderRadius: 12, background: "#fff", border: "1px solid var(--border)", overflow: "hidden" }}>
          <PhotoSlot
            machineId={machine.id}
            label={t.overview}
            photo={overview}
            readOnly={false}
            height={overview?.storage_path ? 186 : 46}
            radius={0}
            placeholder={t.addMachinePhoto}
            emptyText={t.addMachinePhoto}
            isOverview
            onUploaded={setOverview}
          />
          <div style={{ padding: 15 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ font: "400 11px/1 var(--font-body)", color: "var(--red)" }}>{machine.asset_tag}</div>
                <div style={{ font: "600 19px/1.2 var(--font-display)", letterSpacing: "-.01em" }}>{machine.name}</div>
                <div style={{ font: "400 12px/1.35 var(--font-display)", color: "var(--grey-label)" }}>
                  {machine.manufacturer ?? "—"} · {roomName}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <QRCodeTile
                  value={typeof window !== "undefined" ? `${window.location.origin}/m/${machine.asset_tag}` : machine.asset_tag}
                  size={50}
                />
                <DownloadQrButton
                  assetTag={machine.asset_tag}
                  value={typeof window !== "undefined" ? `${window.location.origin}/m/${machine.asset_tag}` : machine.asset_tag}
                  compact
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 9,
                background: STATUS_TINT[status],
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    font: "500 10px/1 var(--font-body)",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: colors.bg,
                    opacity: 0.75,
                  }}
                >
                  {t.nextServiceLabel}
                </div>
                <div style={{ marginTop: 5, font: "600 15px/1 var(--font-display)", color: colors.bg }}>
                  {formatDate(machine.next_due)}
                </div>
              </div>
              <div style={{ font: "500 11px/1.3 var(--font-display)", color: colors.bg, textAlign: "right", maxWidth: 130 }}>
                {statusLongLabel(status, parseISODate(machine.next_due), t)}
              </div>
            </div>
          </div>
        </div>

        {openFaults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SectionHeading>{t.unresolvedFaults}</SectionHeading>
            {openFaults.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "var(--red-tint)",
                  border: "1px solid var(--red)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ font: "600 12px/1.3 var(--font-display)" }}>{severityLabel(f.severity, t)}</span>
                  <span style={{ font: "400 10px/1 var(--font-body)", color: "var(--grey-text)" }}>
                    {formatDate(f.created_at)}
                  </span>
                </div>
                {f.description && (
                  <div style={{ font: "400 12px/1.4 var(--font-body)", color: "#4a4b4d" }}>{f.description}</div>
                )}
                <div style={{ font: "400 11px/1 var(--font-body)", color: "var(--grey-text)" }}>
                  {t.reportedBy} {f.reporter_name}
                </div>
                <button
                  onClick={() => markResolved(f.id)}
                  style={{
                    alignSelf: "flex-start",
                    padding: 0,
                    border: 0,
                    background: "none",
                    font: "500 11px/1 var(--font-display)",
                    color: "var(--red)",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  {t.markResolved}
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Link
            href={`/app/register/${machine.asset_tag}/log`}
            style={{
              padding: 13,
              borderRadius: 10,
              background: "var(--black)",
              color: "var(--sheet)",
              font: "600 13px/1 var(--font-display)",
              textAlign: "center",
            }}
          >
            {t.logService}
          </Link>
          <Link
            href={`/m/${machine.asset_tag}/fault`}
            style={{
              padding: 13,
              borderRadius: 10,
              background: "#fff",
              color: "var(--red)",
              border: "1px solid rgba(249,49,57,.4)",
              font: "600 13px/1 var(--font-display)",
              textAlign: "center",
            }}
          >
            {t.reportFault}
          </Link>
        </div>

        <Link
          href={`/app/register/${machine.asset_tag}/edit`}
          style={{
            alignSelf: "flex-start",
            font: "500 12px/1 var(--font-display)",
            color: "var(--red)",
            textDecoration: "underline",
          }}
        >
          {t.editInfo}
        </Link>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {specs.map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 14,
                padding: "10px 2px",
                borderBottom: "1px solid rgba(0,0,0,.07)",
              }}
            >
              <span style={{ font: "400 12px/1.3 var(--font-display)", color: "var(--grey-label)" }}>{k}</span>
              <span style={{ font: "500 13px/1.3 var(--font-display)", color: "var(--black)", textAlign: "right" }}>
                {v}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <SectionHeading>{t.inventory}</SectionHeading>
            <Link
              href={`/m/${machine.asset_tag}/photos`}
              style={{ font: "500 11px/1 var(--font-display)", color: "var(--red)" }}
            >
              {t.viewAll} →
            </Link>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {otherPhotos.map((p) => {
              const url = p.storage_path ? photoPublicUrl(supabase, p.storage_path) : null;
              return (
                <div key={p.id} style={{ flex: "none", width: 104, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div
                    style={{
                      width: 104,
                      height: 78,
                      borderRadius: 6,
                      backgroundColor: url ? undefined : "var(--sheet)",
                      backgroundImage: url ? `url(${url})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: `${p.reframe_x * 100}% ${p.reframe_y * 100}%`,
                    }}
                  />
                  <div style={{ font: "400 10px/1.2 var(--font-body)", color: "var(--grey-text)" }}>{p.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <SectionHeading>{t.history}</SectionHeading>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ font: "400 11px/1 var(--font-body)", color: "var(--grey-label)" }}>{services.length}</div>
              {services.length > 0 && (
                <Link
                  href={`/app/register/${machine.asset_tag}/history`}
                  style={{ font: "500 11px/1 var(--font-display)", color: "var(--red)", textDecoration: "underline" }}
                >
                  {t.edit}
                </Link>
              )}
            </div>
          </div>
          {services.length === 0 ? (
            <div style={{ padding: 14, borderRadius: 10, background: "var(--sheet)", font: "400 12px/1.5 var(--font-body)", color: "var(--grey-text)" }}>
              {t.noHistory}
            </div>
          ) : (
            services.map((h, i) => (
              <div key={h.id} style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      background: i === 0 ? "var(--red)" : "var(--grey-faint)",
                    }}
                  />
                  {i < services.length - 1 && (
                    <div style={{ flex: 1, width: 1, background: "rgba(0,0,0,.12)", marginTop: 4 }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ font: "600 13px/1.3 var(--font-display)" }}>{workTypeLabel(h.work_type, t)}</span>
                    <span style={{ font: "400 11px/1 var(--font-body)", color: "var(--grey-label)" }}>
                      {formatDate(h.date)}
                    </span>
                  </div>
                  {h.notes && (
                    <div style={{ marginTop: 4, font: "400 12px/1.45 var(--font-display)", color: "var(--grey-text)" }}>
                      {h.notes}
                    </div>
                  )}
                  <div style={{ marginTop: 5, font: "400 11px/1 var(--font-body)", color: "var(--grey-faint)" }}>
                    {h.signed_off_by_name ?? "—"}
                  </div>
                  {h.invoice_number && (
                    <div
                      style={{
                        marginTop: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        border: "1px solid rgba(0,0,0,.12)",
                        borderRadius: 6,
                        background: "#ffffff",
                      }}
                    >
                      <span style={{ font: "400 10.5px/1.3 var(--font-body)", color: "#4a4b4d" }}>
                        {[h.invoice_number, h.supplier, h.amount_chf ? `CHF ${h.amount_chf}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        font: "600 11px/1 var(--font-display)",
        letterSpacing: ".1em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}
