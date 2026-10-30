import { requireSuperadmin } from "@/lib/auth";
import { loadPipelineData } from "@/lib/admin/pipeline";
import { ExampleForm } from "@/components/ReferenceForms";

export default async function ExamplesPage() {
  await requireSuperadmin();
  const data = await loadPipelineData();
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Generation examples ({data.examples.length})</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Active examples are inserted wherever a prompt step uses <code>{"${examples}"}</code>, to show the model the tone we want.
        </p>
      </div>
      <section className="flex flex-col gap-4">
        {data.examples.map((e) => (
          <div key={e.id} className="rounded border border-black p-3">
            <ExampleForm example={e} />
          </div>
        ))}
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">New example</h2>
        <ExampleForm example={null} />
      </section>
    </main>
  );
}
