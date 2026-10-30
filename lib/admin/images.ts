"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "moments";

export type StoredImage = {
  path: string;
  ownerId: string;
  name: string;
  sizeBytes: number | null;
  mimeType: string | null;
  updatedAt: string | null;
  publicUrl: string;
};

// Lists every photo in the moments bucket: one folder per user, files inside.
export async function listImages(): Promise<StoredImage[]> {
  await requireSuperadmin();
  const supabase = await createClient();
  const { data: folders, error } = await supabase.storage.from(BUCKET).list("", { limit: 1000 });
  if (error) throw new Error(`Could not list image folders: ${error.message}`);

  const images: StoredImage[] = [];
  for (const folder of folders ?? []) {
    if (folder.id !== null) continue; // a file at the root, not a user folder
    const { data: files, error: filesError } = await supabase.storage
      .from(BUCKET)
      .list(folder.name, { limit: 1000, sortBy: { column: "updated_at", order: "desc" } });
    if (filesError) throw new Error(`Could not list ${folder.name}: ${filesError.message}`);
    for (const file of files ?? []) {
      const path = `${folder.name}/${file.name}`;
      images.push({
        path,
        ownerId: folder.name,
        name: file.name,
        sizeBytes: typeof file.metadata?.size === "number" ? file.metadata.size : null,
        mimeType: typeof file.metadata?.mimetype === "string" ? file.metadata.mimetype : null,
        updatedAt: file.updated_at ?? null,
        publicUrl: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
      });
    }
  }
  return images.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export type ActionResult = { ok: true } | { ok: false; error: string };

// Refuses to delete a photo a moment still shows; delete the moment instead.
export async function deleteImage(path: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!/^[0-9a-f-]{36}\/[^/]+$/i.test(path)) return { ok: false, error: "Unknown image." };
  const supabase = await createClient();
  const { data: used, error: usedError } = await supabase
    .from("generations")
    .select("id")
    .like("image_url", `%/${BUCKET}/${path}`)
    .limit(1);
  if (usedError) return { ok: false, error: usedError.message };
  if (used.length > 0) return { ok: false, error: "A moment uses this photo. Delete the moment instead." };
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/images");
  return { ok: true };
}
