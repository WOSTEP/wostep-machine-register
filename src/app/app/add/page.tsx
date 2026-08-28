import { createClient } from "@/lib/supabase/server";
import { listRooms } from "@/lib/data/rooms";
import { AddMachineClient } from "./AddMachineClient";

export default async function AddMachinePage() {
  const supabase = await createClient();
  const rooms = await listRooms(supabase);
  return <AddMachineClient initialRooms={rooms} />;
}
