"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { useLang } from "@/lib/i18n/LangProvider";
import { useToast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import { getMachineByTag, listMachineSummaries } from "@/lib/data/machines";
import { photoPublicUrl } from "@/lib/data/photos";
import type { MachineSummary } from "@/lib/data/types";

/** Pulls the asset tag out of a scanned value — a full `/m/<tag>` machine URL (what the
 * printed/generated QR codes encode), or, defensively, a bare tag string. */
function extractAssetTag(raw: string): string {
  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/m\/([^/]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {
    // not an absolute URL — fall through to treating it as a bare tag
  }
  return raw.trim();
}

export default function StaffScanPage() {
  const { t } = useLang();
  const router = useRouter();
  const showToast = useToast();
  const supabase = createClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const [machines, setMachines] = useState<MachineSummary[] | null>(null);

  useEffect(() => {
    listMachineSummaries(supabase).then(setMachines).catch(() => setMachines([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let busy = false;
    let lastMiss: string | null = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    async function handleDecoded(raw: string) {
      const tag = extractAssetTag(raw);
      if (!tag || tag === lastMiss) return;
      busy = true;
      try {
        const machine = await getMachineByTag(supabase, tag);
        if (!active) return;
        if (machine) {
          active = false;
          if (rafId) cancelAnimationFrame(rafId);
          stream?.getTracks().forEach((tr) => tr.stop());
          router.push(`/app/register/${machine.asset_tag}`);
          return;
        }
        lastMiss = tag;
        showToast(t.notFound, t.notFoundBody);
      } catch {
        // transient read error — keep scanning
      } finally {
        busy = false;
      }
    }

    function tick() {
      const video = videoRef.current;
      if (active && video && ctx && !busy && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(frame.data, frame.width, frame.height);
        if (result?.data) handleDecoded(result.data);
      }
      if (active) rafId = requestAnimationFrame(tick);
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => {
        if (active) setCameraError(true);
      });
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then(async (s) => {
          if (!active) {
            s.getTracks().forEach((tr) => tr.stop());
            return;
          }
          stream = s;
          const video = videoRef.current;
          if (!video) return;
          video.srcObject = s;
          await video.play();
          rafId = requestAnimationFrame(tick);
        })
        .catch(() => {
          if (active) setCameraError(true);
        });
    }

    return () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#1a1a1a" }}>
      <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 0" }}>
        <Link
          href="/app/register"
          style={{ font: "500 12px/1 var(--font-display)", color: "rgba(239,239,237,.55)" }}
        >
          ← {t.tList}
        </Link>
      </div>

      <div
        style={{
          position: "relative",
          height: 322,
          marginTop: 14,
          background: "var(--panel-dark)",
          overflow: "hidden",
          flex: "none",
        }}
      >
        {!cameraError && (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 198,
            height: 198,
            pointerEvents: "none",
          }}
        >
          {[
            { top: 0, left: 0, br: "4px 0 0 0", bl: true, bt: true },
            { top: 0, right: 0, br: "0 4px 0 0", bt: true, brdr: true },
            { bottom: 0, left: 0, br: "0 0 0 4px", bl: true, bb: true },
            { bottom: 0, right: 0, br: "0 0 4px 0", bb: true, brdr: true },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: c.top,
                left: c.left,
                right: c.right,
                bottom: c.bottom,
                width: 32,
                height: 32,
                borderRadius: c.br,
                borderLeft: c.bl ? "2px solid #efefed" : undefined,
                borderRight: c.brdr ? "2px solid #efefed" : undefined,
                borderTop: c.bt ? "2px solid #efefed" : undefined,
                borderBottom: c.bb ? "2px solid #efefed" : undefined,
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 20,
            textAlign: "center",
            font: "400 12px/1.4 var(--font-body)",
            color: "rgba(239,239,237,.6)",
            padding: "0 32px",
          }}
        >
          {cameraError ? t.cameraError : t.scanPrompt}
        </div>
      </div>

      <div
        style={{
          padding: "22px 16px calc(28px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          gap: 11,
        }}
      >
        <div
          style={{
            font: "500 10px/1 var(--font-display)",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "rgba(239,239,237,.45)",
          }}
        >
          {t.orSelect}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            borderRadius: 10,
            overflow: "hidden",
            background: "rgba(255,255,255,.05)",
          }}
        >
          {(machines ?? []).map((m) => {
            const thumb = m.overview_photo_path ? photoPublicUrl(supabase, m.overview_photo_path) : null;
            return (
              <Link
                key={m.id}
                href={`/app/register/${m.asset_tag}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "11px 14px",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    flex: "none",
                    width: 42,
                    height: 42,
                    borderRadius: 6,
                    overflow: "hidden",
                    backgroundColor: thumb ? undefined : "rgba(255,255,255,.09)",
                    backgroundImage: thumb ? `url(${thumb})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", font: "500 14px/1.2 var(--font-display)", color: "#efefed" }}>
                    {m.name}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      font: "400 10.5px/1 var(--font-body)",
                      color: "rgba(239,239,237,.45)",
                    }}
                  >
                    {m.asset_tag} · {m.room_name_en}
                  </span>
                </span>
                <span style={{ flex: "none", font: "400 15px/1 var(--font-body)", color: "rgba(239,239,237,.35)" }}>
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
