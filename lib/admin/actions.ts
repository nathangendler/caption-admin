"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CAPTION_LENGTH = 300;
const MAX_CAPTION_POSITION = 16;
const MOMENTS_BUCKET = "moments";

function cleanCaption(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_CAPTION_LENGTH ? trimmed : null;
}

export async function updateCaption(captionId: string, text: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(captionId)) return { ok: false, error: "Unknown caption." };
  const clean = cleanCaption(text);
  if (!clean) return { ok: false, error: `Caption must be 1 to ${MAX_CAPTION_LENGTH} characters.` };

  const supabase = await createClient();
  const { error } = await supabase.from("captions").update({ text: clean }).eq("id", captionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addCaption(momentId: string, text: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(momentId)) return { ok: false, error: "Unknown moment." };
  const clean = cleanCaption(text);
  if (!clean) return { ok: false, error: `Caption must be 1 to ${MAX_CAPTION_LENGTH} characters.` };

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("captions")
    .select("position")
    .eq("generation_id", momentId)
    .order("position", { ascending: false })
    .limit(1);
  if (readError) return { ok: false, error: readError.message };
  const position = (existing[0]?.position ?? 0) + 1;
  if (position > MAX_CAPTION_POSITION) {
    return { ok: false, error: `A moment can hold at most ${MAX_CAPTION_POSITION} captions.` };
  }
  const { error } = await supabase
    .from("captions")
    .insert({ generation_id: momentId, position, text: clean });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCaption(captionId: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(captionId)) return { ok: false, error: "Unknown caption." };

  const supabase = await createClient();
  const { data: winnerOf, error: readError } = await supabase
    .from("generations")
    .select("id")
    .eq("winner_caption_id", captionId)
    .limit(1);
  if (readError) return { ok: false, error: readError.message };
  if (winnerOf.length > 0) {
    return { ok: false, error: "This caption is the posted winner. Pick another winner first." };
  }
  const { error } = await supabase.from("captions").delete().eq("id", captionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Makes a caption the posted one. On a draft this also posts the moment.
export async function setWinner(momentId: string, captionId: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(momentId) || !UUID.test(captionId)) return { ok: false, error: "Unknown moment." };

  const supabase = await createClient();
  const { data: moment, error: readError } = await supabase
    .from("generations")
    .select("posted_at")
    .eq("id", momentId)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!moment) return { ok: false, error: "Moment not found." };
  const { error } = await supabase
    .from("generations")
    .update({
      winner_caption_id: captionId,
      posted_at: moment.posted_at ?? new Date().toISOString(),
    })
    .eq("id", momentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateNote(momentId: string, note: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(momentId)) return { ok: false, error: "Unknown moment." };
  const trimmed = note.trim();
  if (trimmed.length > 200) return { ok: false, error: "Note must be 200 characters or fewer." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("generations")
    .update({ user_note: trimmed || null })
    .eq("id", momentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteMoment(momentId: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(momentId)) return { ok: false, error: "Unknown moment." };

  const supabase = await createClient();
  const { data: moment, error: readError } = await supabase
    .from("generations")
    .select("image_url")
    .eq("id", momentId)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!moment) return { ok: false, error: "Moment not found." };

  const marker = `/${MOMENTS_BUCKET}/`;
  const index = moment.image_url.indexOf(marker);
  if (index >= 0) {
    const { error: storageError } = await supabase.storage
      .from(MOMENTS_BUCKET)
      .remove([moment.image_url.slice(index + marker.length)]);
    if (storageError) return { ok: false, error: `Could not remove the photo: ${storageError.message}` };
  }
  const { error } = await supabase.from("generations").delete().eq("id", momentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Privileged profile changes go through definer functions that re-check the
// caller in the database and refuse changes to your own account.
export async function setSuperadmin(userId: string, value: boolean): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(userId)) return { ok: false, error: "Unknown user." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_superadmin", { target_user: userId, value });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function banUser(userId: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(userId)) return { ok: false, error: "Unknown user." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_ban_user", { target_user: userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  await requireSuperadmin();
  if (!UUID.test(userId)) return { ok: false, error: "Unknown user." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_unban_user", { target_user: userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
