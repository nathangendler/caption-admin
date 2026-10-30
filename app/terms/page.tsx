import { requireSuperadmin } from "@/lib/auth";
import { loadPipelineData } from "@/lib/admin/pipeline";
import { TermForm } from "@/components/ReferenceForms";

export default async function TermsPage() {
  await requireSuperadmin();
  const data = await loadPipelineData();
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Terms ({data.terms.length})</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Legal documents shown on the main app at <code>/terms/&lt;slug&gt;</code>. Only published ones are public; <code>privacy-policy</code> also serves <code>/privacy</code>.
        </p>
      </div>
      <section className="flex flex-col gap-4">
        {data.terms.map((t) => (
          <div key={t.id} className="rounded border border-black p-3">
            <p className="mb-2 text-sm text-neutral-600">
              {t.published_at ? `Published ${t.published_at.slice(0, 10)}` : "Draft"} · updated {t.updated_at.slice(0, 10)}
            </p>
            <TermForm term={t} />
          </div>
        ))}
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">New document</h2>
        <TermForm term={null} />
      </section>
    </main>
  );
}
