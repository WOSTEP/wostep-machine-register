import type { DB, Room } from "./types";

export async function listRooms(db: DB): Promise<Room[]> {
  const { data, error } = await db.from("rooms").select("*").order("name_en");
  if (error) throw error;
  return data;
}

export async function createRoom(
  db: DB,
  input: { name_en: string; name_fr: string }
): Promise<Room> {
  const { data, error } = await db.from("rooms").insert(input).select().single();
  if (error) throw error;
  return data;
}
