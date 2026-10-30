"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { deleteRow, setChainWeights, upsertRow } from "@/lib/admin/crud";
import type { ChainRow, ModelRow, StepRow } from "@/lib/admin/pipeline";
import { DeleteButton, Field, inputClass, primaryClass, useAction } from "@/components/Forms";

// Prompt chain mix: one weight per chain, saved together.
export function MixForm({ chains }: { chains: ChainRow[] }) {
  const { run, pending, error } = useAction();
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(chains.map((c) => [c.id, c.mix_weight])),
  );
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    run(
      () => setChainWeights(chains.map((c) => ({ id: c.id, mixWeight: weights[c.id] ?? 0 }))),
      () => setSaved(true),
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black">
            <th className="th">Chain</th>
            <th className="th">Active</th>
            <th className="th">Weight</th>
            <th className="th">Share of new moments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black">
          {chains.map((c) => {
            const w = weights[c.id] ?? 0;
            return (
              <tr key={c.id}>
                <td className="py-2 pr-4"><a href={`/chains/${c.id}`} className="underline">{c.name}</a></td>
                <td className="py-2 pr-4">{c.is_active ? "yes" : "no"}</td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min={0}
                    value={w}
                    onChange={(e) => setWeights({ ...weights, [c.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                    className={inputClass + " w-24"}
                  />
                </td>
                <td className="py-2 pr-4">{total > 0 && c.is_active ? `${Math.round((w / total) * 100)}%` : "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryClass}>Save mix</button>
        {saved && <span className="text-sm">Saved.</span>}
        {error && <span className="text-sm font-semibold">{error}</span>}
        {total === 0 && <span className="text-sm font-semibold">All weights are zero: generation is effectively off.</span>}
      </div>
    </form>
  );
}

export function ChainForm({ chain }: { chain: ChainRow | null }) {
  const router = useRouter();
  const { run, pending, error } = useAction();
  const [name, setName] = useState(chain?.name ?? "");
  const [description, setDescription] = useState(chain?.description ?? "");
  const [isActive, setIsActive] = useState(chain?.is_active ?? true);

  function submit(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        upsertRow("prompt_chains", {
          ...(chain ? { id: chain.id, mix_weight: chain.mix_weight } : {}),
          name,
          description: description.trim() || null,
          is_active: isActive,
        }),
      () => {
        if (!chain) {
          setName("");
          setDescription("");
          router.refresh();
        }
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass + " w-64"} required />
      </Field>
      <Field label="Description">
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass + " w-96"} />
      </Field>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
      </label>
      <button type="submit" disabled={pending} className={primaryClass}>{chain ? "Save" : "Create chain"}</button>
      {chain && (
        <DeleteButton
          confirmText="Delete this chain and all its steps? Past moments keep their recorded prompt."
          onDelete={async () => {
            const result = await deleteRow("prompt_chains", chain.id);
            if (result.ok) router.push("/chains");
            return result;
          }}
        />
      )}
      {error && <span className="text-sm font-semibold">{error}</span>}
    </form>
  );
}

export function StepForm({
  chainId,
  step,
  models,
  nextPosition,
}: {
  chainId: string;
  step: StepRow | null;
  models: ModelRow[];
  nextPosition: number;
}) {
  const { run, pending, error } = useAction();
  const [position, setPosition] = useState(step?.position ?? nextPosition);
  const [name, setName] = useState(step?.name ?? "");
  const [modelId, setModelId] = useState(step?.llm_model_id ?? models[0]?.id ?? "");
  const [temperature, setTemperature] = useState(step ? Number(step.temperature) : 1);
  const [systemPrompt, setSystemPrompt] = useState(step?.system_prompt ?? "");
  const [userPrompt, setUserPrompt] = useState(step?.user_prompt ?? "");
  const [usesImage, setUsesImage] = useState(step?.uses_image ?? true);
  const [open, setOpen] = useState(step === null ? false : true);

  function submit(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        upsertRow("prompt_chain_steps", {
          ...(step ? { id: step.id } : {}),
          chain_id: chainId,
          position,
          name,
          llm_model_id: modelId,
          temperature,
          system_prompt: systemPrompt,
          user_prompt: userPrompt,
          uses_image: usesImage,
        }),
      () => {
        if (!step) {
          setName("");
          setUserPrompt("");
          setSystemPrompt("");
          setOpen(false);
        }
      },
    );
  }

  if (!step && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={primaryClass}>
        Add step
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded border border-black p-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Position">
          <input type="number" min={1} value={position} onChange={(e) => setPosition(Number(e.target.value))} className={inputClass + " w-20"} />
        </Field>
        <Field label="Step name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass + " w-56"} required />
        </Field>
        <Field label="Model">
          <select value={modelId} onChange={(e) => setModelId(e.target.value)} className={inputClass}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}{m.is_active ? "" : " (inactive)"}</option>
            ))}
          </select>
        </Field>
        <Field label="Temperature">
          <input type="number" min={0} max={2} step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className={inputClass + " w-20"} />
        </Field>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={usesImage} onChange={(e) => setUsesImage(e.target.checked)} /> Send the photo
        </label>
      </div>
      <Field label="System prompt (optional)">
        <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={2} className={inputClass + " font-mono text-xs"} />
      </Field>
      <Field label="User prompt. Variables: ${captionCount} ${examples} ${note} ${previousOutput}">
        <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} rows={6} className={inputClass + " font-mono text-xs"} required />
      </Field>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryClass}>{step ? "Save step" : "Add step"}</button>
        {step && <DeleteButton confirmText="Delete this step?" onDelete={() => deleteRow("prompt_chain_steps", step.id)} />}
        {!step && (
          <button type="button" onClick={() => setOpen(false)} className="text-sm underline">Cancel</button>
        )}
        {error && <span className="text-sm font-semibold">{error}</span>}
      </div>
    </form>
  );
}
