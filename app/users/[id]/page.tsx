import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { indexBy, loadDataset, profileName } from "@/lib/admin/data";
import { userActivity } from "@/lib/admin/stats";
import { Avatar } from "@/components/Avatar";
import { UserTools } from "@/components/UserTools";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperadmin();
  const { id } = await params;
  const data = await loadDataset();
  const profile = data.profiles.find((p) => p.id === id);
  if (!profile) notFound();
  const activity = userActivity(data).get(id);
  const captions = indexBy(data.captions);
  const moments = data.generations.filter((g) => g.user_id === id);
  const likedIds = new Set(data.likes.filter((l) => l.user_id === id).map((l) => l.generation_id));
  const liked = data.generations.filter((g) => likedIds.has(g.id));

  return (
    <main className="flex flex-col gap-6">
      <Link href="/users" className="text-sm underline">← Users</Link>
      <div className="card flex items-center gap-4 p-4">
        <Avatar url={profile.avatar_url} name={profileName(profile)} size={56} />
        <div>
          <h1 className="text-lg font-semibold">{profileName(profile)}</h1>
          <p className="text-[12px] text-subtle">{profile.email} · joined {profile.created_at.slice(0, 10)}</p>
          {profile.bio && <p className="mt-1 text-[13px]">{profile.bio}</p>}
          <p className="mt-1 text-[12px] text-subtle">
            {activity?.posts ?? 0} posts · {activity?.drafts ?? 0} unfinished · {activity?.picks ?? 0} picks ·{" "}
            {activity?.likesGiven ?? 0} likes given · {activity?.likesReceived ?? 0} received
            {profile.is_superadmin && " · superadmin"}
            {profile.banned_at && ` · banned ${profile.banned_at.slice(0, 10)}`}
          </p>
        </div>
      </div>

      <section className="rounded border border-black p-3">
        <h2 className="mb-2 font-semibold">Access</h2>
        <UserTools
          userId={profile.id}
          isSuperadmin={profile.is_superadmin}
          isBanned={profile.banned_at !== null}
          isSelf={profile.id === admin.id}
        />
      </section>

      <section>
        <span className="eyebrow">Their moments</span>
        {moments.length === 0 ? (
          <p className="mt-2 text-[13px] text-subtle">None yet.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {moments.map((g) => (
              <li key={g.id}>
                <Link href={`/moments/${g.id}`} className="card block overflow-hidden">
                  <Image src={g.image_url} alt="" width={300} height={300} className="aspect-square w-full object-cover" />
                  <p className="line-clamp-2 p-2 text-[12px]">
                    {g.winner_caption_id ? captions.get(g.winner_caption_id)?.text : <span className="text-accent-strong">Unfinished</span>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <span className="eyebrow">Moments they liked</span>
        {liked.length === 0 ? (
          <p className="mt-2 text-[13px] text-subtle">None yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-black card">
            {liked.map((g) => (
              <li key={g.id} className="px-3 py-2 text-[13px]">
                <Link href={`/moments/${g.id}`} className="underline">
                  {g.winner_caption_id ? captions.get(g.winner_caption_id)?.text : g.id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
