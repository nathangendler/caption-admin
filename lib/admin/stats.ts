import type { CaptionRow, Dataset, GenerationRow, PickRow } from "./data";

export type Totals = {
  users: number;
  superadmins: number;
  moments: number;
  posted: number;
  drafts: number;
  captions: number;
  picks: number;
  likes: number;
};

export function totals(d: Dataset): Totals {
  const posted = d.generations.filter((g) => g.posted_at !== null).length;
  return {
    users: d.profiles.length,
    superadmins: d.profiles.filter((p) => p.is_superadmin).length,
    moments: d.generations.length,
    posted,
    drafts: d.generations.length - posted,
    captions: d.captions.length,
    picks: d.picks.length,
    likes: d.likes.length,
  };
}

function utcDay(iso: string): string {
  return iso.slice(0, 10);
}

export type DayCount = { day: string; count: number };

// Posts per UTC day for the last `days` days, oldest first, zero-filled.
export function postsPerDay(d: Dataset, days: number, now: Date): DayCount[] {
  const counts = new Map<string, number>();
  for (const g of d.generations) {
    if (g.posted_at) {
      const day = utcDay(g.posted_at);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }
  const result: DayCount[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * 86_400_000);
    const day = date.toISOString().slice(0, 10);
    result.push({ day, count: counts.get(day) ?? 0 });
  }
  return result;
}

export function completionRate(d: Dataset): number | null {
  if (d.generations.length === 0) return null;
  return d.generations.filter((g) => g.posted_at !== null).length / d.generations.length;
}

// Which caption slot (1-8) ends up winning. Later slots enter the ladder later, so a
// skew to the right means fresher captions have an edge over the reigning one.
export function winnerPositionHistogram(d: Dataset, slots: number): DayCount[] {
  const captionById = new Map(d.captions.map((c) => [c.id, c]));
  const counts = Array.from({ length: slots }, () => 0);
  for (const g of d.generations) {
    const winner = g.winner_caption_id ? captionById.get(g.winner_caption_id) : undefined;
    if (winner && winner.position >= 1 && winner.position <= slots) {
      counts[winner.position - 1] += 1;
    }
  }
  return counts.map((count, index) => ({ day: String(index + 1), count }));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Seconds between consecutive picks in the same ladder: how long a choice takes.
export function medianSecondsPerPick(d: Dataset): number | null {
  const byMoment = new Map<string, PickRow[]>();
  for (const pick of d.picks) {
    const list = byMoment.get(pick.generation_id) ?? [];
    list.push(pick);
    byMoment.set(pick.generation_id, list);
  }
  const gaps: number[] = [];
  for (const picks of byMoment.values()) {
    const ordered = [...picks].sort((a, b) => a.pick_index - b.pick_index);
    for (let i = 1; i < ordered.length; i += 1) {
      const gap =
        (new Date(ordered[i].created_at).getTime() - new Date(ordered[i - 1].created_at).getTime()) /
        1000;
      if (gap >= 0) gaps.push(gap);
    }
  }
  return median(gaps);
}

export type LengthComparison = { winners: number | null; others: number | null };

// Average character length of winning captions vs the ones they beat.
export function captionLengths(d: Dataset): LengthComparison {
  const winnerIds = new Set(
    d.generations.map((g) => g.winner_caption_id).filter((id): id is string => id !== null),
  );
  const postedIds = new Set(d.generations.filter((g) => g.posted_at).map((g) => g.id));
  const winners: number[] = [];
  const others: number[] = [];
  for (const c of d.captions) {
    if (!postedIds.has(c.generation_id)) continue;
    (winnerIds.has(c.id) ? winners : others).push(c.text.length);
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  return { winners: avg(winners), others: avg(others) };
}

const EMOJI = /\p{Extended_Pictographic}/u;

export type EmojiShare = { winners: number | null; all: number | null };

// Share of captions containing an emoji, for winners vs every caption.
export function emojiShare(d: Dataset): EmojiShare {
  const winnerIds = new Set(
    d.generations.map((g) => g.winner_caption_id).filter((id): id is string => id !== null),
  );
  const share = (rows: CaptionRow[]) =>
    rows.length ? rows.filter((c) => EMOJI.test(c.text)).length / rows.length : null;
  return {
    winners: share(d.captions.filter((c) => winnerIds.has(c.id))),
    all: share(d.captions),
  };
}

export type TopPost = {
  id: string;
  caption: string;
  likes: number;
  userId: string;
  postedAt: string;
};

export function topPosts(d: Dataset, limit: number): TopPost[] {
  const captionById = new Map(d.captions.map((c) => [c.id, c]));
  const likeCounts = new Map<string, number>();
  for (const like of d.likes) {
    likeCounts.set(like.generation_id, (likeCounts.get(like.generation_id) ?? 0) + 1);
  }
  return d.generations
    .filter((g): g is GenerationRow & { posted_at: string; winner_caption_id: string } =>
      g.posted_at !== null && g.winner_caption_id !== null,
    )
    .map((g) => ({
      id: g.id,
      caption: captionById.get(g.winner_caption_id)?.text ?? "",
      likes: likeCounts.get(g.id) ?? 0,
      userId: g.user_id,
      postedAt: g.posted_at,
    }))
    .sort((a, b) => b.likes - a.likes || b.postedAt.localeCompare(a.postedAt))
    .slice(0, limit);
}

export type UserActivity = {
  userId: string;
  posts: number;
  drafts: number;
  likesGiven: number;
  likesReceived: number;
  picks: number;
};

export function userActivity(d: Dataset): Map<string, UserActivity> {
  const result = new Map<string, UserActivity>();
  const get = (userId: string) => {
    const existing = result.get(userId);
    if (existing) return existing;
    const fresh = { userId, posts: 0, drafts: 0, likesGiven: 0, likesReceived: 0, picks: 0 };
    result.set(userId, fresh);
    return fresh;
  };
  for (const p of d.profiles) get(p.id);
  const ownerByMoment = new Map(d.generations.map((g) => [g.id, g.user_id]));
  for (const g of d.generations) {
    if (g.posted_at) get(g.user_id).posts += 1;
    else get(g.user_id).drafts += 1;
  }
  for (const like of d.likes) {
    get(like.user_id).likesGiven += 1;
    const owner = ownerByMoment.get(like.generation_id);
    if (owner) get(owner).likesReceived += 1;
  }
  for (const pick of d.picks) get(pick.user_id).picks += 1;
  return result;
}

export function modelUsage(d: Dataset): DayCount[] {
  const counts = new Map<string, number>();
  for (const g of d.generations) counts.set(g.model, (counts.get(g.model) ?? 0) + 1);
  return [...counts.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count);
}
