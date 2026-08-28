import { createClient } from "@/lib/supabase/server";
import { getMachineByTag } from "@/lib/data/machines";
import { listPhotos } from "@/lib/data/photos";
import { getSessionUser } from "@/lib/session";
import { NotFoundScreen } from "@/components/NotFoundScreen";
import { PhotosClient } from "./PhotosClient";

export default async function PhotosPage({ params }: PageProps<"/m/[tag]/photos">) {
  const { tag } = await params;
  const supabase = await createClient();
  const [machine, user] = await Promise.all([
    getMachineByTag(supabase, tag),
    getSessionUser(),
  ]);
  if (!machine) return <NotFoundScreen />;

  const photos = await listPhotos(supabase, machine.id);

  return <PhotosClient machine={machine} initialPhotos={photos} isStaff={!!user} />;
}
