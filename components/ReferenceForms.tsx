"use client";

import { useState, type FormEvent } from "react";
import { deleteRow, upsertRow } from "@/lib/admin/crud";
import type { ModelRow, ProviderRow, ExampleRow, TermRow } from "@/lib/admin/pipeline";
import { DeleteButton, Field, inputClass, outlineClass, primaryClass, useAction } from "@/components/Forms";

/* ---------- Providers ---------- */

export function ProviderForm({ provider }: { provider: ProviderRow | null }) {
  const { run, pending, error } = useAction();
  const [slug, setSlug] = useState(provider?.slug ?? "groq");
  const [name, setName] = useState(provider?.name ?? "");
  const [apiKeyEnv, setApiKeyEnv] = useState(provider?.api_key_env ?? "");
  const [isActive, setIsActive] = useState(provider?.is_active ?? true);

  function submit(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        upsertRow("llm_providers", {
          ...(provider ? { id: provider.id } : {}),
          slug,
          name,
          api_key_env: apiKeyEnv,
          is_active: isActive,
        }),
      () => {
        if (!provider) {
          setName("");
          setApiKeyEnv("");
        }
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field label="Provider">
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} disabled={!!provider}>
          <option value="groq">groq</option>
          <option value="gemini">gemini</option>
        </select>
      </Field>
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
      </Field>
      <Field label="API key env var">
        <input value={apiKeyEnv} onChange={(e) => setApiKeyEnv(e.target.value)} className={inputClass} placeholder="GROQ_API_KEY" required />
      </Field>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
      </label>
      <button type="submit" disabled={pending} className={primaryClass}>{provider ? "Save" : "Add provider"}</button>
      {provider && (
        <DeleteButton confirmText="Delete this provider? Models that use it must be deleted first." onDelete={() => deleteRow("llm_providers", provider.id)} />
      )}
      {error && <span className="text-sm font-semibold">{error}</span>}
    </form>
  );
}

/* ---------- Models ---------- */

export function ModelForm({ model, providers }: { model: ModelRow | null; providers: ProviderRow[] }) {
  const { run, pending, error } = useAction();
  const [providerId, setProviderId] = useState(model?.provider_id ?? providers[0]?.id ?? "");
  const [modelId, setModelId] = useState(model?.model_id ?? "");
  const [name, setName] = useState(model?.name ?? "");
  const [supportsImages, setSupportsImages] = useState(model?.supports_images ?? true);
  const [isActive, setIsActive] = useState(model?.is_active ?? true);

  function submit(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        upsertRow("llm_models", {
          ...(model ? { id: model.id } : {}),
          provider_id: providerId,
          model_id: modelId,
          name,
          supports_images: supportsImages,
          is_active: isActive,
        }),
      () => {
        if (!model) {
          setModelId("");
          setName("");
        }
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field label="Provider">
        <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className={inputClass}>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Model id">
        <input value={modelId} onChange={(e) => setModelId(e.target.value)} className={inputClass + " w-56"} placeholder="qwen/qwen3.8-27b" required />
      </Field>
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
      </Field>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={supportsImages} onChange={(e) => setSupportsImages(e.target.checked)} /> Reads images
      </label>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
      </label>
      <button type="submit" disabled={pending} className={primaryClass}>{model ? "Save" : "Add model"}</button>
      {model && (
        <DeleteButton confirmText="Delete this model? Steps that use it must be changed first." onDelete={() => deleteRow("llm_models", model.id)} />
      )}
      {error && <span className="text-sm font-semibold">{error}</span>}
    </form>
  );
}

/* ---------- Examples ---------- */

export function ExampleForm({ example }: { example: ExampleRow | null }) {
  const { run, pending, error } = useAction();
  const [caption, setCaption] = useState(example?.caption ?? "");
  const [note, setNote] = useState(example?.note ?? "");
  const [isActive, setIsActive] = useState(example?.is_active ?? true);

  function submit(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        upsertRow("generation_examples", {
          ...(example ? { id: example.id } : {}),
          caption,
          note: note.trim() || null,
          is_active: isActive,
        }),
      () => {
        if (!example) {
          setCaption("");
          setNote("");
        }
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Field label="Example caption">
        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} className={inputClass} required />
      </Field>
      <Field label="Why it's good (optional, shown only here)">
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active (used in prompts)
        </label>
        <button type="submit" disabled={pending} className={primaryClass}>{example ? "Save" : "Add example"}</button>
        {example && <DeleteButton confirmText="Delete this example?" onDelete={() => deleteRow("generation_examples", example.id)} />}
        {error && <span className="text-sm font-semibold">{error}</span>}
      </div>
    </form>
  );
}

/* ---------- Terms ---------- */

export function TermForm({ term }: { term: TermRow | null }) {
  const { run, pending, error } = useAction();
  const [slug, setSlug] = useState(term?.slug ?? "");
  const [title, setTitle] = useState(term?.title ?? "");
  const [body, setBody] = useState(term?.body ?? "");
  const [version, setVersion] = useState(term?.version ?? 1);
  const [published, setPublished] = useState(term?.published_at !== null && term?.published_at !== undefined);

  function submit(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        upsertRow("terms", {
          ...(term ? { id: term.id } : {}),
          slug,
          title,
          body,
          version,
          published_at: published ? (term?.published_at ?? new Date().toISOString()) : null,
          updated_at: new Date().toISOString(),
        }),
      () => {
        if (!term) {
          setSlug("");
          setTitle("");
          setBody("");
        }
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Slug (URL)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} pattern="[a-z0-9-]+" className={inputClass} placeholder="privacy-policy" required disabled={!!term} />
        </Field>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass + " w-72"} required />
        </Field>
        <Field label="Version">
          <input type="number" min={1} value={version} onChange={(e) => setVersion(Number(e.target.value))} className={inputClass + " w-20"} />
        </Field>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
        </label>
      </div>
      <Field label="Body (blank line between paragraphs, '## ' for a heading)">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className={inputClass + " font-mono text-xs"} required />
      </Field>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryClass}>{term ? "Save" : "Create"}</button>
        {term && <DeleteButton confirmText="Delete this document? The public page will 404." onDelete={() => deleteRow("terms", term.id)} />}
        {term?.published_at && (
          <a href={`https://hello-world-nextjs-blue.vercel.app/terms/${term.slug}`} target="_blank" rel="noreferrer" className={outlineClass + " px-2 py-1 text-xs"}>
            View live
          </a>
        )}
        {error && <span className="text-sm font-semibold">{error}</span>}
      </div>
    </form>
  );
}

/* ---------- Signup rules ---------- */

export function AddValueForm({
  table,
  column,
  placeholder,
  label,
}: {
  table: "allowed_signup_domains" | "whitelisted_emails";
  column: "domain" | "email";
  placeholder: string;
  label: string;
}) {
  const { run, pending, error } = useAction();
  const [value, setValue] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = value.trim().toLowerCase();
    run(
      () =>
        table === "allowed_signup_domains"
          ? upsertRow("allowed_signup_domains", { domain: clean })
          : upsertRow("whitelisted_emails", { email: clean }),
      () => setValue(""),
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field label={label}>
        <input value={value} onChange={(e) => setValue(e.target.value)} className={inputClass + " w-64"} placeholder={placeholder} required />
      </Field>
      <button type="submit" disabled={pending} className={primaryClass}>Add</button>
      {error && <span className="text-sm font-semibold">{error}</span>}
      <span className="sr-only">{column}</span>
    </form>
  );
}
