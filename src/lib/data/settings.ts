import type { DB, Settings } from "./types";

export async function getSettings(db: DB): Promise<Settings> {
  const { data, error } = await db.from("settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function setDueLeadDays(db: DB, days: number): Promise<Settings> {
  const { data, error } = await db
    .from("settings")
    .update({ due_lead_days: days })
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}
