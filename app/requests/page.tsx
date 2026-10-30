import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { indexBy, loadDataset, profileName } from "@/lib/admin/data";
import { loadPipelineData } from "@/lib/admin/pipeline";

export default async function RequestsPage() {
  await requireSuperadmin();
  const [data, pipeline] = await Promise.all([loadDataset(), loadPipelineData()]);
  const profiles = indexBy(data.profiles);
  const chainById = new Map(pipeline.chains.map((c) => [c.id, c]));
  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Generation requests ({data.generations.length})</h1>
        <p className="mt-1 text-sm text-neutral-600">One row per photo submitted for captions, with the chain and model that handled it.</p>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black">
            <th className="th">When</th>
            <th className="th">By</th>
            <th className="th">Chain</th>
            <th className="th">Model</th>
            <th className="th">Note</th>
            <th className="th">Outcome</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black">
          {data.generations.map((g) => (
            <tr key={g.id}>
              <td className="whitespace-nowrap py-2 pr-4">{new Date(g.created_at).toLocaleString("en-US")}</td>
              <td className="py-2 pr-4"><Link href={`/users/${g.user_id}`} className="underline">{profileName(profiles.get(g.user_id))}</Link></td>
              <td className="py-2 pr-4">{g.prompt_chain_id ? chainById.get(g.prompt_chain_id)?.name ?? "chain removed" : "before chains"}</td>
              <td className="py-2 pr-4">{g.model}</td>
              <td className="max-w-xs truncate py-2 pr-4 text-neutral-600">{g.user_note}</td>
              <td className="py-2 pr-4"><Link href={`/moments/${g.id}`} className="underline">{g.posted_at ? "posted" : "unfinished"}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
