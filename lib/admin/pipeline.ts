import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type T = Database["public"]["Tables"];
export type ProviderRow = T["llm_providers"]["Row"];
export type ModelRow = T["llm_models"]["Row"];
export type ChainRow = T["prompt_chains"]["Row"];
export type StepRow = T["prompt_chain_steps"]["Row"];
export type ExampleRow = T["generation_examples"]["Row"];
export type TermRow = T["terms"]["Row"];
export type DomainRow = T["allowed_signup_domains"]["Row"];
export type WhitelistRow = T["whitelisted_emails"]["Row"];
export type ResponseRow = T["llm_responses"]["Row"];

export type PipelineData = {
  providers: ProviderRow[];
  models: ModelRow[];
  chains: ChainRow[];
  steps: StepRow[];
  examples: ExampleRow[];
  terms: TermRow[];
  domains: DomainRow[];
  whitelist: WhitelistRow[];
};

export const loadPipelineData = cache(async (): Promise<PipelineData> => {
  const supabase = await createClient();
  const [providers, models, chains, steps, examples, terms, domains, whitelist] = await Promise.all([
    supabase.from("llm_providers").select("*").order("name"),
    supabase.from("llm_models").select("*").order("name"),
    supabase.from("prompt_chains").select("*").order("name"),
    supabase.from("prompt_chain_steps").select("*").order("position"),
    supabase.from("generation_examples").select("*").order("created_at", { ascending: false }),
    supabase.from("terms").select("*").order("slug"),
    supabase.from("allowed_signup_domains").select("*").order("domain"),
    supabase.from("whitelisted_emails").select("*").order("email"),
  ]);
  for (const [name, result] of Object.entries({ providers, models, chains, steps, examples, terms, domains, whitelist })) {
    if (result.error) throw new Error(`Failed to load ${name}: ${result.error.message}`);
  }
  return {
    providers: providers.data ?? [],
    models: models.data ?? [],
    chains: chains.data ?? [],
    steps: steps.data ?? [],
    examples: examples.data ?? [],
    terms: terms.data ?? [],
    domains: domains.data ?? [],
    whitelist: whitelist.data ?? [],
  };
});

export async function loadResponses(limit: number): Promise<ResponseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("llm_responses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load responses: ${error.message}`);
  return data;
}
