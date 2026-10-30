import { requireSuperadmin } from "@/lib/auth";
import { loadPipelineData } from "@/lib/admin/pipeline";
import { ProviderForm } from "@/components/ReferenceForms";

export default async function ProvidersPage() {
  await requireSuperadmin();
  const data = await loadPipelineData();
  const modelCount = new Map<string, number>();
  for (const m of data.models) modelCount.set(m.provider_id, (modelCount.get(m.provider_id) ?? 0) + 1);
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">LLM providers ({data.providers.length})</h1>
        <p className="mt-1 text-sm text-neutral-600">
          API keys never live in the database. A provider names the environment variable that holds its key on the main app&apos;s deployment.
        </p>
      </div>
      <section className="flex flex-col gap-4">
        {data.providers.map((p) => (
          <div key={p.id} className="rounded border border-black p-3">
            <p className="mb-2 text-sm text-neutral-600">{modelCount.get(p.id) ?? 0} models</p>
            <ProviderForm provider={p} />
          </div>
        ))}
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">New provider</h2>
        <ProviderForm provider={null} />
      </section>
    </main>
  );
}
