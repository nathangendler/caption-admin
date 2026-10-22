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
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Moments ({moments.length})</h1>
        <nav className="flex gap-1">
          {(["all", "posted", "drafts"] as const).map((f) => (
            <Link
              key={f}
              href={f === "all" ? "/moments" : `/moments?show=${f}`}
              className={`rounded px-3 py-1 text-sm ${filter === f ? "bg-black text-white" : "border border-black bg-white text-black hover:opacity-70"}`}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black">
              <th className="th">Photo</th>
              <th className="th">Caption</th>
              <th className="th">By</th>
              <th className="th">Status</th>
              <th className="th text-right">Picks</th>
              <th className="th text-right">Likes</th>
              <th className="th">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {moments.map((g) => (
              <tr key={g.id}>
                <td className="px-3 py-2">
                  <Link href={`/moments/${g.id}`}>
                    <Image src={g.image_url} alt="" width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                  </Link>
                </td>
                <td className="max-w-xs px-3 py-2">
                  <Link href={`/moments/${g.id}`} className="line-clamp-2 font-semibold hover:underline">
                    {g.winner_caption_id ? captions.get(g.winner_caption_id)?.text : <span className="font-normal text-subtle">No winner yet</span>}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/users/${g.user_id}`} className="underline">{profileName(profiles.get(g.user_id))}</Link>
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
