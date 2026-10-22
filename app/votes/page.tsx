import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { indexBy, loadDataset, profileName } from "@/lib/admin/data";

export default async function VotesPage() {
  await requireSuperadmin();
  const data = await loadDataset();
  const profiles = indexBy(data.profiles);
  const captions = indexBy(data.captions);
  const generations = indexBy(data.generations);
  const picks = data.picks.slice(0, 100);
  const likes = data.likes.slice(0, 100);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-7 sm:px-8">
      <div>
        <span className="eyebrow">Votes</span>
        <h1 className="title mt-1 text-[28px] leading-tight">
          {data.picks.length} picks · {data.likes.length} likes
        </h1>
        <p className="mt-1 text-[12px] text-subtle">Read only. Showing the latest 100 of each.</p>
      </div>

      <section>
        <span className="eyebrow">Latest picks</span>
        <div className="card mt-2 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[11px] uppercase tracking-[0.1em] text-muted">
              <tr className="border-b border-hairline">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Who</th>
                <th className="px-3 py-2">Winner</th>
                <th className="px-3 py-2">Loser</th>
                <th className="px-3 py-2">Moment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {picks.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-subtle">{new Date(p.created_at).toLocaleString("en-US")}</td>
                  <td className="px-3 py-2"><Link href={`/users/${p.user_id}`} className="hover:underline">{profileName(profiles.get(p.user_id))}</Link></td>
                  <td className="px-3 py-2 font-bold text-ink">{captions.get(p.winner_caption_id)?.text}</td>
                  <td className="px-3 py-2 text-subtle">{captions.get(p.loser_caption_id)?.text}</td>
                  <td className="px-3 py-2"><Link href={`/moments/${p.generation_id}`} className="hover:underline">pick {p.pick_index + 1}</Link></td>
                </tr>
              ))}
              {picks.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-subtle">No picks yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <span className="eyebrow">Latest likes</span>
        <div className="card mt-2 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[11px] uppercase tracking-[0.1em] text-muted">
              <tr className="border-b border-hairline">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Who</th>
                <th className="px-3 py-2">Moment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {likes.map((l) => {
                const g = generations.get(l.generation_id);
                return (
                  <tr key={`${l.generation_id}-${l.user_id}`}>
                    <td className="whitespace-nowrap px-3 py-2 text-subtle">{new Date(l.created_at).toLocaleString("en-US")}</td>
                    <td className="px-3 py-2"><Link href={`/users/${l.user_id}`} className="hover:underline">{profileName(profiles.get(l.user_id))}</Link></td>
                    <td className="px-3 py-2">
                      <Link href={`/moments/${l.generation_id}`} className="font-bold text-ink hover:underline">
                        {g?.winner_caption_id ? captions.get(g.winner_caption_id)?.text : l.generation_id}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {likes.length === 0 && <tr><td colSpan={3} className="px-3 py-4 text-subtle">No likes yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
