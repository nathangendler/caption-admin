"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type ActionResult = { ok: true } | { ok: false; error: string };

type Tables = Database["public"]["Tables"];

// Every table the admin may write, with its primary key column. Anything else is refused.
const EDITABLE = {
  llm_providers: "id",
  llm_models: "id",
  prompt_chains: "id",
  prompt_chain_steps: "id",
  generation_examples: "id",
  terms: "id",
  allowed_signup_domains: "domain",
  whitelisted_emails: "email",
} as const;

export type EditableTable = keyof typeof EDITABLE;

export async function upsertRow<T extends EditableTable>(
  table: T,
  row: Tables[T]["Insert"],
): Promise<ActionResult> {
  await requireSuperadmin();
  if (!(table in EDITABLE)) return { ok: false, error: "Unknown table." };
  // Per-table row types don't narrow through a generic key, so the write goes through an
  // untyped client; the allowlist above and the typed `row` parameter are the guards.
  const db: SupabaseClient = (await createClient()) as unknown as SupabaseClient;
  const { error } = await db.from(table).upsert(row, { onConflict: EDITABLE[table] });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteRow<T extends EditableTable>(
  table: T,
  key: string,
): Promise<ActionResult> {
  await requireSuperadmin();
  if (!(table in EDITABLE)) return { ok: false, error: "Unknown table." };
  const db: SupabaseClient = (await createClient()) as unknown as SupabaseClient;
  const { error } = await db.from(table).delete().eq(EDITABLE[table], key);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Prompt chain mix: every weight saved in one call.
export async function setChainWeights(weights: Array<{ id: string; mixWeight: number }>): Promise<ActionResult> {
  await requireSuperadmin();
  for (const w of weights) {
    if (!Number.isInteger(w.mixWeight) || w.mixWeight < 0) {
      return { ok: false, error: "Weights must be whole numbers of zero or more." };
    }
  }
  const supabase = await createClient();
  for (const w of weights) {
    const { error } = await supabase.from("prompt_chains").update({ mix_weight: w.mixWeight }).eq("id", w.id);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
