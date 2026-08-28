import type { Database } from "../supabase/types";
import type { DB, Machine, MachineSummary } from "./types";

type MachineInsert = Database["public"]["Tables"]["machines"]["Insert"];

export async function listMachineSummaries(db: DB): Promise<MachineSummary[]> {
  const { data, error } = await db
    .from("machine_summary")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getMachineByTag(
  db: DB,
  assetTag: string
): Promise<MachineSummary | null> {
  const { data, error } = await db
    .from("machine_summary")
    .select("*")
    .eq("asset_tag", assetTag)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMachine(db: DB, input: MachineInsert): Promise<Machine> {
  const { data, error } = await db.from("machines").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateMachine(
  db: DB,
  id: string,
  patch: Partial<Machine>
): Promise<Machine> {
  const { data, error } = await db
    .from("machines")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function nextAssetTagSuffix(db: DB, prefix: string): Promise<string> {
  const { data, error } = await db
    .from("machines")
    .select("asset_tag")
    .ilike("asset_tag", `${prefix}%`);
  if (error) throw error;
  const max = data.reduce((acc, row) => {
    const match = row.asset_tag.match(/-(\d+)$/);
    const n = match ? parseInt(match[1], 10) : 0;
    return Math.max(acc, n);
  }, 0);
  return String(max + 1).padStart(2, "0");
}
