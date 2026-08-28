import { createClient } from "@/lib/supabase/server";
import { getMachineByTag } from "@/lib/data/machines";
import { listRooms } from "@/lib/data/rooms";
import { NotFoundScreen } from "@/components/NotFoundScreen";
import { EditMachineClient } from "./EditMachineClient";

export default async function EditMachinePage({ params }: PageProps<"/app/register/[tag]/edit">) {
  const { tag } = await params;
  const supabase = await createClient();
  const [machine, rooms] = await Promise.all([getMachineByTag(supabase, tag), listRooms(supabase)]);
  if (!machine) return <NotFoundScreen />;

  return <EditMachineClient machine={machine} initialRooms={rooms} />;
}
