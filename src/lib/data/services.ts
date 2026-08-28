import type { Database } from "../supabase/types";
import type { DB, Service } from "./types";

type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];

export async function listServices(db: DB, machineId: string): Promise<Service[]> {
  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("machine_id", machineId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Logs a service and recalculates the machine's next_due in one call, per
 * the README's "On save" rule for screen 07 (Log a service).
 */
export async function logService(
  db: DB,
  input: ServiceInsert & { nextDue: string }
): Promise<Service> {
  const { nextDue, ...serviceInput } = input;
  const { data, error } = await db
    .from("services")
    .insert(serviceInput)
    .select()
    .single();
  if (error) throw error;

  const { error: updateError } = await db
    .from("machines")
    .update({ last_service: input.date, next_due: nextDue })
    .eq("id", input.machine_id);
  if (updateError) throw updateError;

  return data;
}

export async function updateService(
  db: DB,
  id: string,
  patch: Partial<Service>
): Promise<Service> {
  const { data, error } = await db
    .from("services")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
