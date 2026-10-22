import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type GenerationRow = Database["public"]["Tables"]["generations"]["Row"];
export type CaptionRow = Database["public"]["Tables"]["captions"]["Row"];
export type PickRow = Database["public"]["Tables"]["picks"]["Row"];
export type LikeRow = Database["public"]["Tables"]["likes"]["Row"];

export type Dataset = {
  profiles: ProfileRow[];
  generations: GenerationRow[];
  captions: CaptionRow[];
  picks: PickRow[];
  likes: LikeRow[];
};

const LIMIT = 5000;

// The whole dataset, once per request. At class-project scale this is a few
// hundred rows; every page derives what it needs from it in pure functions.
export const loadDataset = cache(async (): Promise<Dataset> => {
  const supabase = await createClient();
  const [profiles, generations, captions, picks, likes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(LIMIT),
    supabase.from("generations").select("*").order("created_at", { ascending: false }).limit(LIMIT),
    supabase.from("captions").select("*").order("position").limit(LIMIT),
    supabase.from("picks").select("*").order("created_at", { ascending: false }).limit(LIMIT),
    supabase.from("likes").select("*").order("created_at", { ascending: false }).limit(LIMIT),
  ]);
  for (const [name, result] of Object.entries({ profiles, generations, captions, picks, likes })) {
    if (result.error) {
      throw new Error(`Failed to load ${name}: ${result.error.message}`);
    }
  }
  return {
    profiles: profiles.data ?? [],
    generations: generations.data ?? [],
    captions: captions.data ?? [],
    picks: picks.data ?? [],
    likes: likes.data ?? [],
  };
});

export function profileName(profile: ProfileRow | undefined): string {
  if (!profile) return "Unknown user";
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return name || profile.email || profile.id.slice(0, 8);
}

export function indexBy<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}
