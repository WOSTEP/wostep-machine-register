import type { Strings } from "./i18n/strings";

export type MachineStatus = "ok" | "due" | "overdue" | "fault";

export const STATUS_COLORS: Record<MachineStatus, { bg: string; fg: string }> = {
  ok: { bg: "var(--green)", fg: "#000000" },
  due: { bg: "var(--yellow)", fg: "#000000" },
  overdue: { bg: "var(--red)", fg: "#ffffff" },
  fault: { bg: "var(--red)", fg: "#ffffff" },
};

export const STATUS_TINT: Record<MachineStatus, string> = {
  ok: "var(--green-tint)",
  due: "var(--yellow-tint)",
  overdue: "var(--red-tint)",
  fault: "var(--red-tint)",
};

export function statusLabel(status: MachineStatus, t: Strings): string {
  return {
    ok: t.stOk,
    due: t.stDue,
    overdue: t.stOverdue,
    fault: t.stFault,
  }[status];
}

/**
 * fault > overdue > due > ok, per the README's "Status derivation" rule.
 */
export function computeStatus(params: {
  nextDue: Date | null;
  hasBlockingFault: boolean;
  leadDays: number;
  today?: Date;
}): MachineStatus {
  const { nextDue, hasBlockingFault, leadDays } = params;
  const today = params.today ?? new Date();

  if (hasBlockingFault) return "fault";
  if (!nextDue) return "ok";

  const diffDays = Math.floor(
    (startOfDay(nextDue).getTime() - startOfDay(today).getTime()) / 86_400_000
  );
  if (diffDays < 0) return "overdue";
  if (diffDays <= leadDays) return "due";
  return "ok";
}

/** Plain-language status, e.g. "Overdue by 6329 days" / "In 12 days" (screen 05). */
export function statusLongLabel(
  status: MachineStatus,
  nextDue: Date | null,
  t: Strings,
  today: Date = new Date()
): string {
  if (status === "fault") return t.stFault;
  if (!nextDue) return t.stOk;

  const diffDays = Math.floor(
    (startOfDay(nextDue).getTime() - startOfDay(today).getTime()) / 86_400_000
  );
  if (diffDays < 0) return t.overdueByDays.replace("{n}", String(Math.abs(diffDays)));
  if (diffDays === 0) return t.dueToday;
  return t.inDays.replace("{n}", String(diffDays));
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** DD.MM.YYYY everywhere, per the README's "Dates" rule. */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISODate(date) : date;
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/** Parses a "DD.MM.YYYY" string (the app's input/display format). */
export function parseDisplayDate(str: string | null | undefined): Date | null {
  if (!str) return null;
  const parts = str.split(".");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parses a Postgres "YYYY-MM-DD" date string. */
export function parseISODate(str: string | null | undefined): Date | null {
  if (!str) return null;
  const [yyyy, mm, dd] = str.split("-").map((p) => parseInt(p, 10));
  if (!yyyy || !mm || !dd) return null;
  return new Date(yyyy, mm - 1, dd);
}

/** Formats a Date as "YYYY-MM-DD" for Postgres date columns. */
export function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}
