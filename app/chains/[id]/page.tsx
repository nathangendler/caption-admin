import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { loadPipelineData } from "@/lib/admin/pipeline";
import { ChainForm, StepForm } from "@/components/ChainForms";

export default async function ChainPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperadmin();
  const { id } = await params;
  const data = await loadPipelineData();
  const chain = data.chains.find((c) => c.id === id);
  if (!chain) notFound();
  const steps = data.steps.filter((s) => s.chain_id === id).sort((a, b) => a.position - b.position);
  const modelById = new Map(data.models.map((m) => [m.id, m]));

  return (
    <main className="flex flex-col gap-6">
      <Link href="/chains" className="text-sm underline">← Prompt chains</Link>
      <div>
        <h1 className="text-xl font-semibold">{chain.name}</h1>
        <p className="mt-1 text-sm text-neutral-600">Weight {chain.mix_weight} · {chain.is_active ? "active" : "inactive"}</p>
      </div>
      <ChainForm chain={chain} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Steps ({steps.length})</h2>
        {steps.length === 0 && <p className="text-sm text-neutral-600">No steps yet. A chain with no steps is never used.</p>}
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col gap-1">
            <p className="text-sm">
              <span className="font-semibold">#{step.position} {step.name}</span>
              <span className="text-neutral-600"> · {modelById.get(step.llm_model_id)?.name ?? "missing model"} · temp {Number(step.temperature)} · {step.uses_image ? "with photo" : "text only"}</span>
            </p>
            <StepForm chainId={chain.id} step={step} models={data.models} nextPosition={steps.length + 1} />
          </div>
        ))}
        <StepForm chainId={chain.id} step={null} models={data.models} nextPosition={steps.length + 1} />
      </section>
    </main>
  );
}
