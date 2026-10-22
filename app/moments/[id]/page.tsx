import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { indexBy, loadDataset, profileName } from "@/lib/admin/data";
import { CaptionRow } from "@/components/CaptionRow";
import { AddCaptionForm, DeleteMomentButton, NoteEditor } from "@/components/MomentTools";

export default async function MomentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperadmin();
  const { id } = await params;
  const data = await loadDataset();
  const moment = data.generations.find((g) => g.id === id);
  if (!moment) notFound();
  const profiles = indexBy(data.profiles);
  const captions = data.captions.filter((c) => c.generation_id === id).sort((a, b) => a.position - b.position);
  const captionById = indexBy(captions);
  const picks = data.picks.filter((p) => p.generation_id === id).sort((a, b) => a.pick_index - b.pick_index);
  const likes = data.likes.filter((l) => l.generation_id === id);
  const wins = new Map<string, number>();
  for (const pick of picks) wins.set(pick.winner_caption_id, (wins.get(pick.winner_caption_id) ?? 0) + 1);

  return (
    <main className="flex flex-col gap-6">
      <Link href="/moments" className="text-sm underline">← Moments</Link>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-3">
          <div className="card overflow-hidden bg-gray-soft">
            <Image src={moment.image_url} alt="" width={800} height={800} className="mx-auto h-auto max-h-96 w-auto max-w-full object-contain" />
          </div>
          <div className="card flex flex-col gap-1 p-3 text-[12px] text-subtle">
            <p>
              By{" "}
              <Link href={`/users/${moment.user_id}`} className="font-semibold hover:underline">
                {profileName(profiles.get(moment.user_id))}
              </Link>
            </p>
            <p>Created {new Date(moment.created_at).toLocaleString("en-US")}</p>
            <p>{moment.posted_at ? `Posted ${new Date(moment.posted_at).toLocaleString("en-US")}` : "Not posted yet"}</p>
            <p>Model: {moment.model}</p>
            <p>{likes.length} {likes.length === 1 ? "like" : "likes"}</p>
          </div>
          <NoteEditor momentId={moment.id} note={moment.user_note} />
          <details className="card p-3 text-[12px]">
            <summary className="cursor-pointer font-bold text-ink">Prompt sent to the model</summary>
            <pre className="mt-2 whitespace-pre-wrap text-subtle">{moment.prompt}</pre>
          </details>
          <DeleteMomentButton momentId={moment.id} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="eyebrow">Captions</span>
            <ul className="card mt-2 divide-y divide-black">
              {captions.map((c) => (
                <CaptionRow
                  key={c.id}
                  momentId={moment.id}
                  captionId={c.id}
                  position={c.position}
                  text={c.text}
                  isWinner={c.id === moment.winner_caption_id}
                  wins={wins.get(c.id) ?? 0}
                />
              ))}
            </ul>
            <div className="mt-3">
              <AddCaptionForm momentId={moment.id} />
            </div>
          </div>

          <div>
            <span className="eyebrow">Ladder picks</span>
            {picks.length === 0 ? (
              <p className="mt-2 text-[13px] text-subtle">No picks yet.</p>
            ) : (
              <ol className="card mt-2 divide-y divide-black text-[12px]">
                {picks.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 px-3 py-2">
                    <span className="w-4 font-bold text-muted">{p.pick_index + 1}</span>
                    <span className="flex-1">
                      <span className="font-bold text-ink">{captionById.get(p.winner_caption_id)?.text}</span>
                      <span className="text-muted"> beat </span>
                      <span className="text-subtle">{captionById.get(p.loser_caption_id)?.text}</span>
                    </span>
                    <span className="shrink-0 text-muted">{new Date(p.created_at).toLocaleTimeString("en-US")}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <span className="eyebrow">Liked by</span>
            {likes.length === 0 ? (
              <p className="mt-2 text-[13px] text-subtle">Nobody yet.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2 text-[12px]">
                {likes.map((l) => (
                  <li key={l.user_id}>
                    <Link href={`/users/${l.user_id}`} className="rounded-full border border-card-border px-2 py-0.5 hover:border-ink">
                      {profileName(profiles.get(l.user_id))}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
