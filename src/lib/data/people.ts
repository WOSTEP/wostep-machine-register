import type { DB, Person } from "./types";

export async function listPeople(db: DB): Promise<Person[]> {
  const { data, error } = await db.from("people").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getPersonByEmail(db: DB, email: string): Promise<Person | null> {
  const { data, error } = await db
    .from("people")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function addPerson(
  db: DB,
  input: { name: string; email: string }
): Promise<Person> {
  const { data, error } = await db
    .from("people")
    .insert({ ...input, receives_due_reminders: true, receives_fault_reports: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setReceivesDueReminders(
  db: DB,
  id: string,
  value: boolean
): Promise<Person> {
  const { data, error } = await db
    .from("people")
    .update({ receives_due_reminders: value })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
