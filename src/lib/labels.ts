import type { Strings } from "./i18n/strings";
import type { FaultSeverity, PersonRole, WorkType } from "./supabase/types";

export const WORK_TYPES: WorkType[] = [
  "annual_service",
  "inspection",
  "repair",
  "calibration",
  "cleaning",
];

export function workTypeLabel(type: WorkType, t: Strings): string {
  return {
    annual_service: t.workAnnualService,
    inspection: t.workInspection,
    repair: t.workRepair,
    calibration: t.workCalibration,
    cleaning: t.workCleaning,
    carried_forward: t.workCarriedForward,
  }[type];
}

export const SEVERITIES: FaultSeverity[] = ["blocking", "partial", "minor"];

export function severityLabel(sev: FaultSeverity, t: Strings): string {
  return { blocking: t.sevBlocking, partial: t.sevPartial, minor: t.sevMinor }[sev];
}

export const SEVERITY_DOT: Record<FaultSeverity, string> = {
  blocking: "var(--red)",
  partial: "var(--yellow)",
  minor: "var(--grey-label)",
};

export function roleLabel(role: PersonRole | null, t: Strings): string {
  if (role === "director") return t.roleDirector;
  if (role === "instructor") return t.roleInstructor;
  return t.roleExternal;
}

export function isStaffEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@wostep.ch");
}

export const LEAD_OPTIONS = [60, 30, 14, 7] as const;
export const INTERVAL_OPTIONS = [6, 12, 24, 36] as const;

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}
