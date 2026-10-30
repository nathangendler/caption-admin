import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { loadPipelineData } from "@/lib/admin/pipeline";
import { ChainForm, MixForm } from "@/components/ChainForms";

export default async function ChainsPage() {
  await requireSuperadmin();
  const data = await loadPipelineData();
  const stepCount = new Map<string, number>();
  for (const step of data.steps) stepCount.set(step.chain_id, (stepCount.get(step.chain_id) ?? 0) + 1);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Prompt chains ({data.chains.length})</h1>
        <p className="mt-1 text-sm text-neutral-600">
          A chain is an ordered list of prompt steps. New moments pick an active chain at random in
          proportion to its weight. The last step must answer with JSON captions.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Mix</h2>
        <MixForm chains={data.chains} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">All chains</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="th">Name</th>
              <th className="th">Description</th>
              <th className="th">Steps</th>
              <th className="th">Active</th>
              <th className="th">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {data.chains.map((c) => (
              <tr key={c.id}>
                <td className="py-2 pr-4"><Link href={`/chains/${c.id}`} className="font-semibold underline">{c.name}</Link></td>
                <td className="py-2 pr-4 text-neutral-600">{c.description}</td>
                <td className="py-2 pr-4">{stepCount.get(c.id) ?? 0}</td>
                <td className="py-2 pr-4">{c.is_active ? "yes" : "no"}</td>
                <td className="py-2 pr-4">{c.mix_weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">New chain</h2>
        <ChainForm chain={null} />
      </section>
    </main>
  );
}
