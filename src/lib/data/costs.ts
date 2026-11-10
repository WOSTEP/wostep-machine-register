import type { Database } from "../supabase/types";
import type { DB, GeneralCost } from "./types";

type GeneralCostInsert = Database["public"]["Tables"]["general_costs"]["Insert"];

/** Minimal service rows needed for cost totals (staff-only via RLS). */
export type ServiceCostRow = { machine_id: string; date: string; amount_chf: number | null };

export async function listServiceCosts(db: DB): Promise<ServiceCostRow[]> {
  const { data, error } = await db
    .from("services")
    .select("machine_id, date, amount_chf")
    .not("amount_chf", "is", null);
  if (error) throw error;
  return data;
}

export async function listGeneralCosts(db: DB): Promise<GeneralCost[]> {
  const { data, error } = await db
    .from("general_costs")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addGeneralCost(db: DB, input: GeneralCostInsert): Promise<GeneralCost> {
  const { data, error } = await db.from("general_costs").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGeneralCost(db: DB, id: string): Promise<void> {
  const { error } = await db.from("general_costs").delete().eq("id", id);
  if (error) throw error;
}

const chf = new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" });
export function formatCHF(n: number | string): string {
  return chf.format(Number(n));
}
