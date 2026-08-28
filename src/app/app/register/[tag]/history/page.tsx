import { createClient } from "@/lib/supabase/server";
import { getMachineByTag } from "@/lib/data/machines";
import { listServices } from "@/lib/data/services";
import { NotFoundScreen } from "@/components/NotFoundScreen";
import { EditHistoryClient } from "./EditHistoryClient";

export default async function EditHistoryPage({ params }: PageProps<"/app/register/[tag]/history">) {
  const { tag } = await params;
  const supabase = await createClient();
  const machine = await getMachineByTag(supabase, tag);
  if (!machine) return <NotFoundScreen />;

  const services = await listServices(supabase, machine.id);

  return <EditHistoryClient machine={machine} initialServices={services} />;
}
