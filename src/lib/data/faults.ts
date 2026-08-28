import type { DB, Fault } from "./types";

const FAULT_PHOTO_BUCKET = "fault-photos";

/** Uploads fault evidence (already downscaled) and returns its storage path. */
export async function uploadFaultPhoto(db: DB, blob: Blob): Promise<string> {
  const path = `${crypto.randomUUID()}.webp`;
  const { error } = await db.storage
    .from(FAULT_PHOTO_BUCKET)
    .upload(path, blob, { contentType: "image/webp" });
  if (error) throw error;
  return path;
}

export async function listFaults(db: DB, machineId: string): Promise<Fault[]> {
  const { data, error } = await db
    .from("faults")
    .select("*")
    .eq("machine_id", machineId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function reportFault(
  db: DB,
  input: {
    machine_id: string;
    reporter_name: string;
    severity: Fault["severity"];
    description: string | null;
    photo_path?: string | null;
  }
): Promise<Fault> {
  const { data, error } = await db.from("faults").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function resolveFault(db: DB, id: string): Promise<Fault> {
  const { data, error } = await db
    .from("faults")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
