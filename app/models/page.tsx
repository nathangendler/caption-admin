import { requireSuperadmin } from "@/lib/auth";
import { loadPipelineData } from "@/lib/admin/pipeline";
import { ModelForm } from "@/components/ReferenceForms";

export default async function ModelsPage() {
  await requireSuperadmin();
  const data = await loadPipelineData();
  const used = new Map<string, number>();
  for (const s of data.steps) used.set(s.llm_model_id, (used.get(s.llm_model_id) ?? 0) + 1);
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">LLM models ({data.models.length})</h1>
      <section className="flex flex-col gap-4">
        {data.models.map((m) => (
          <div key={m.id} className="rounded border border-black p-3">
            <p className="mb-2 text-sm text-neutral-600">Used by {used.get(m.id) ?? 0} steps</p>
            <ModelForm model={m} providers={data.providers} />
          </div>
        ))}
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">New model</h2>
        {data.providers.length === 0 ? <p className="text-sm">Add a provider first.</p> : <ModelForm model={null} providers={data.providers} />}
      </section>
    </main>
  );
}
