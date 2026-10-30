import { describe, expect, it } from "vitest";
import type { Dataset } from "../data";
import {
  captionLengths,
  completionRate,
  emojiShare,
  medianSecondsPerPick,
  postsPerDay,
  topPosts,
  totals,
  userActivity,
  winnerPositionHistogram,
} from "../stats";

const profile = (id: string, is_superadmin = false): Dataset["profiles"][number] => ({
  id,
  email: `${id}@example.test`,
  first_name: id,
  last_name: null,
  bio: null,
  avatar_url: null,
  created_at: "2026-10-01T00:00:00Z",
  is_superadmin,
  banned_at: null,
});
const moment = (
  id: string,
  user_id: string,
  posted_at: string | null,
  winner_caption_id: string | null,
): Dataset["generations"][number] => ({
  id,
  user_id,
  user_note: null,
  image_url: "https://x/img.jpg",
  prompt: "p",
  model: "groq/qwen",
  created_at: posted_at ?? "2026-10-20T00:00:00Z",
  posted_at,
  winner_caption_id,
  prompt_chain_id: null,
});
const caption = (id: string, generation_id: string, position: number, text: string) => ({
  id,
  generation_id,
  position,
  text,
  created_at: "2026-10-20T00:00:00Z",
});
const pick = (generation_id: string, pick_index: number, created_at: string) => ({
  id: `${generation_id}-${pick_index}`,
  generation_id,
  user_id: "u1",
  pick_index,
  winner_caption_id: "c1",
  loser_caption_id: "c2",
  created_at,
});

const data: Dataset = {
  profiles: [profile("u1", true), profile("u2")],
  generations: [
    moment("g1", "u1", "2026-10-21T10:00:00Z", "c3"),
    moment("g2", "u2", "2026-10-21T12:00:00Z", "c5"),
    moment("g3", "u2", null, null),
  ],
  captions: [
    caption("c1", "g1", 1, "short"),
    caption("c2", "g1", 2, "a much longer losing caption"),
    caption("c3", "g1", 3, "winner with emoji 🐶"),
    caption("c4", "g2", 1, "loser"),
    caption("c5", "g2", 2, "the winner here"),
    caption("c6", "g3", 1, "draft caption"),
  ],
  picks: [
    pick("g1", 0, "2026-10-21T09:00:00Z"),
    pick("g1", 1, "2026-10-21T09:00:10Z"),
    pick("g1", 2, "2026-10-21T09:00:40Z"),
  ],
  likes: [
    { generation_id: "g1", user_id: "u2", created_at: "2026-10-21T11:00:00Z" },
    { generation_id: "g1", user_id: "u1", created_at: "2026-10-21T11:30:00Z" },
    { generation_id: "g2", user_id: "u1", created_at: "2026-10-21T13:00:00Z" },
  ],
};

describe("stats", () => {
  it("counts totals", () => {
    expect(totals(data)).toEqual({
      users: 2,
      superadmins: 1,
      moments: 3,
      posted: 2,
      drafts: 1,
      captions: 6,
      picks: 3,
      likes: 3,
    });
  });

  it("zero-fills posts per day and counts by UTC day", () => {
    const now = new Date("2026-10-22T15:00:00Z");
    expect(postsPerDay(data, 3, now)).toEqual([
      { day: "2026-10-20", count: 0 },
      { day: "2026-10-21", count: 2 },
      { day: "2026-10-22", count: 0 },
    ]);
  });

  it("computes completion rate", () => {
    expect(completionRate(data)).toBeCloseTo(2 / 3);
    expect(completionRate({ ...data, generations: [] })).toBeNull();
  });

  it("builds the winner position histogram", () => {
    expect(winnerPositionHistogram(data, 4).map((b) => b.count)).toEqual([0, 1, 1, 0]);
  });

  it("takes the median gap between consecutive picks", () => {
    expect(medianSecondsPerPick(data)).toBe(20);
    expect(medianSecondsPerPick({ ...data, picks: [] })).toBeNull();
  });

  it("compares caption lengths and emoji share for winners vs the rest", () => {
    const lengths = captionLengths(data);
    expect(lengths.winners).toBeCloseTo(("winner with emoji 🐶".length + "the winner here".length) / 2);
    expect(lengths.others).toBeCloseTo((5 + 28 + 5) / 3);
    expect(emojiShare(data)).toEqual({ winners: 0.5, all: 1 / 6 });
  });

  it("ranks posts by likes and summarises user activity", () => {
    expect(topPosts(data, 5).map((p) => [p.id, p.likes])).toEqual([
      ["g1", 2],
      ["g2", 1],
    ]);
    expect(userActivity(data).get("u2")).toEqual({
      userId: "u2",
      posts: 1,
      drafts: 1,
      likesGiven: 1,
      likesReceived: 1,
      picks: 0,
    });
  });
});
