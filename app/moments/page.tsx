import Image from "next/image";
import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { indexBy, loadDataset, profileName } from "@/lib/admin/data";

type Filter = "all" | "posted" | "drafts";

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  await requireSuperadmin();
  const { show } = await searchParams;
  const filter: Filter = show === "posted" || show === "drafts" ? show : "all";
  const data = await loadDataset();
  const profiles = indexBy(data.profiles);
  const captions = indexBy(data.captions);
  const likeCounts = new Map<string, number>();
  for (const like of data.likes) likeCounts.set(like.generation_id, (likeCounts.get(like.generation_id) ?? 0) + 1);
  const pickCounts = new Map<string, number>();
  for (const pick of data.picks) pickCounts.set(pick.generation_id, (pickCounts.get(pick.generation_id) ?? 0) + 1);

  const moments = data.generations.filter((g) =>
    filter === "all" ? true : filter === "posted" ? g.posted_at !== null : g.posted_at === null,
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">AI media</span>
          <h1 className="title mt-1 text-[28px] leading-tight">{moments.length} moments</h1>
        </div>
        <nav className="flex gap-1">
          {(["all", "posted", "drafts"] as const).map((f) => (
            <Link
              key={f}
              href={f === "all" ? "/moments" : `/moments?show=${f}`}
              className={`btn btn-sm border border-ink ${filter === f ? "bg-ink text-cream" : "text-ink"}`}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-[0.1em] text-muted">
            <tr className="border-b border-hairline">
              <th className="px-3 py-2">Photo</th>
              <th className="px-3 py-2">Caption</th>
              <th className="px-3 py-2">By</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Picks</th>
              <th className="px-3 py-2 text-right">Likes</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {moments.map((g) => (
              <tr key={g.id}>
                <td className="px-3 py-2">
                  <Link href={`/moments/${g.id}`}>
                    <Image src={g.image_url} alt="" width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                  </Link>
                </td>
                <td className="max-w-xs px-3 py-2">
                  <Link href={`/moments/${g.id}`} className="line-clamp-2 font-bold text-ink hover:underline">
                    {g.winner_caption_id ? captions.get(g.winner_caption_id)?.text : <span className="font-normal text-subtle">No winner yet</span>}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/users/${g.user_id}`} className="hover:underline">{profileName(profiles.get(g.user_id))}</Link>
                </td>
                <td className="px-3 py-2">
                  {g.posted_at ? <span className="font-bold text-ink">Posted</span> : <span className="text-accent-strong">Draft</span>}
                </td>
                <td className="px-3 py-2 text-right">{pickCounts.get(g.id) ?? 0}/7</td>
                <td className="px-3 py-2 text-right">{likeCounts.get(g.id) ?? 0}</td>
                <td className="px-3 py-2 text-subtle">{g.created_at.slice(0, 10)}</td>
              </tr>
            ))}
            {moments.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-subtle">Nothing here.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
