import type { DB, Photo } from "./types";

const BUCKET = "machine-photos";

export async function listPhotos(db: DB, machineId: string): Promise<Photo[]> {
  const { data, error } = await db
    .from("photos")
    .select("*")
    .eq("machine_id", machineId)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export function photoPublicUrl(db: DB, storagePath: string): string {
  return db.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

/** Uploads an already-downscaled image blob and creates/updates its photo row. */
export async function uploadPhoto(
  db: DB,
  params: {
    machineId: string;
    label: string;
    isOverview?: boolean;
    blob: Blob;
    existingPhotoId?: string;
  }
): Promise<Photo> {
  const { machineId, label, isOverview = false, blob, existingPhotoId } = params;
  const path = `${machineId}/${crypto.randomUUID()}.webp`;

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/webp", upsert: false });
  if (uploadError) throw uploadError;

  if (existingPhotoId) {
    const { data, error } = await db
      .from("photos")
      .update({ storage_path: path, label })
      .eq("id", existingPhotoId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data: maxSort } = await db
    .from("photos")
    .select("sort_order")
    .eq("machine_id", machineId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("photos")
    .insert({
      machine_id: machineId,
      label,
      is_overview: isOverview,
      storage_path: path,
      sort_order: (maxSort?.sort_order ?? -1) + 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePhotoReframe(
  db: DB,
  photoId: string,
  reframe: { reframe_x: number; reframe_y: number }
): Promise<Photo> {
  const { data, error } = await db
    .from("photos")
    .update(reframe)
    .eq("id", photoId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createPhotoSlot(
  db: DB,
  params: { machineId: string; label: string }
): Promise<Photo> {
  const { data: maxSort } = await db
    .from("photos")
    .select("sort_order")
    .eq("machine_id", params.machineId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("photos")
    .insert({
      machine_id: params.machineId,
      label: params.label,
      sort_order: (maxSort?.sort_order ?? -1) + 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
