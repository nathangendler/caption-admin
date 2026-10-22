import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { indexBy, loadDataset, profileName } from "@/lib/admin/data";
import {
  captionLengths,
  completionRate,
  emojiShare,
  medianSecondsPerPick,
  modelUsage,
  postsPerDay,
  topPosts,
  totals,
  userActivity,
  winnerPositionHistogram,
} from "@/lib/admin/stats";
import { BarChart } from "@/components/BarChart";
import { StatCard } from "@/components/StatCard";

const percent = (value: number | null) => (value === null ? "–" : `${Math.round(value * 100)}%`);
const chars = (value: number | null) => (value === null ? "–" : `${Math.round(value)} chars`);

export default async function OverviewPage() {
  await requireSuperadmin();
  const data = await loadDataset();
  const profiles = indexBy(data.profiles);
  const t = totals(data);
  const perDay = postsPerDay(data, 14, new Date());
  const histogram = winnerPositionHistogram(data, 8);
  const lengths = captionLengths(data);
  const emoji = emojiShare(data);
  const speed = medianSecondsPerPick(data);
  const leaders = [...userActivity(data).values()]
    .sort((a, b) => b.posts - a.posts || b.likesReceived - a.likesReceived)
    .slice(0, 5);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-7 sm:px-8">
      <div>
        <span className="eyebrow">Overview</span>
        <h1 className="title mt-1 text-[28px] leading-tight">What people are doing</h1>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Users" value={String(t.users)} hint={`${t.superadmins} superadmin`} />
        <StatCard label="Posted moments" value={String(t.posted)} hint={`${t.drafts} unfinished`} />
        <StatCard label="Captions written" value={String(t.captions)} hint={`${t.picks} picks made`} />
        <StatCard label="Likes" value={String(t.likes)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Finish rate"
          value={percent(completionRate(data))}
          hint="Moments that made it through all seven picks"
        />
        <StatCard
          label="Seconds per pick"
          value={speed === null ? "–" : `${Math.round(speed)}s`}
          hint="Median time between two picks in a ladder"
        />
        <StatCard
          label="Winners with an emoji"
          value={percent(emoji.winners)}
          hint={`${percent(emoji.all)} of all captions have one`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <span className="eyebrow">Posts per day</span>
          <p className="mt-1 text-[12px] text-subtle">Last 14 days, UTC</p>
          <div className="mt-3">
            <BarChart
              bars={perDay.map((d) => ({ label: d.day.slice(5), value: d.count }))}
              showEveryLabel={false}
            />
          </div>
        </div>
        <div className="card p-4">
          <span className="eyebrow">Which slot wins the ladder</span>
          <p className="mt-1 text-[12px] text-subtle">
            Captions enter in order 1 to 8. A lean to the right means the newest challenger tends
            to beat the reigning caption.
          </p>
          <div className="mt-3">
            <BarChart bars={histogram.map((b) => ({ label: `#${b.day}`, value: b.count }))} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Winning caption length"
          value={chars(lengths.winners)}
          hint={`Losing captions average ${chars(lengths.others)}`}
        />
        <div className="card p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Models used</p>
          <ul className="mt-2 flex flex-col gap-1 text-[13px]">
            {modelUsage(data).map((m) => (
              <li key={m.day} className="flex justify-between">
                <span className="text-ink">{m.day}</span>
                <span className="text-subtle">{m.count}</span>
              </li>
            ))}
            {modelUsage(data).length === 0 && <li className="text-subtle">No moments yet</li>}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <span className="eyebrow">Most liked</span>
          <ol className="mt-3 flex flex-col divide-y divide-hairline">
            {topPosts(data, 5).map((post, index) => (
              <li key={post.id} className="flex items-start gap-3 py-2 text-[13px]">
                <span className="w-5 font-bold text-muted">{index + 1}</span>
                <Link href={`/moments/${post.id}`} className="flex-1 text-ink hover:underline">
                  {post.caption}
                  <span className="block text-[11px] text-subtle">
                    by {profileName(profiles.get(post.userId))}
                  </span>
                </Link>
                <span className="font-bold text-ink">♥ {post.likes}</span>
              </li>
            ))}
            {topPosts(data, 5).length === 0 && <li className="py-2 text-[13px] text-subtle">Nothing posted yet</li>}
          </ol>
        </div>
        <div className="card p-4">
          <span className="eyebrow">Most active</span>
          <ol className="mt-3 flex flex-col divide-y divide-hairline">
            {leaders.map((u, index) => (
              <li key={u.userId} className="flex items-center gap-3 py-2 text-[13px]">
                <span className="w-5 font-bold text-muted">{index + 1}</span>
                <Link href={`/users/${u.userId}`} className="flex-1 text-ink hover:underline">
                  {profileName(profiles.get(u.userId))}
                </Link>
                <span className="text-subtle">
                  {u.posts} posts · {u.likesReceived} likes
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
