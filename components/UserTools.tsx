"use client";

import { useState, useTransition } from "react";
import { banUser, setSuperadmin } from "@/lib/admin/actions";

export function UserTools({
  userId,
  isSuperadmin,
  isBanned,
  isSelf,
}: {
  userId: string;
  isSuperadmin: boolean;
  isBanned: boolean;
  isSelf: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  if (isSelf) {
    return <p className="text-sm text-neutral-600">This is you. You can&apos;t change your own access.</p>;
  }
  if (isBanned) {
    return <p className="text-sm font-semibold">Banned. Bans are permanent from the dashboard.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setSuperadmin(userId, !isSuperadmin))}
        className="rounded border border-black bg-white px-3 py-1.5 text-sm text-black hover:opacity-70 disabled:opacity-50"
      >
        {isSuperadmin ? "Remove superadmin" : "Make superadmin"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Ban this user? They keep their login but can no longer post, pick, or like, and their moments leave the feed. This cannot be undone from here.")) {
            run(() => banUser(userId));
          }
        }}
        className="rounded bg-black px-3 py-1.5 text-sm text-white hover:opacity-70 disabled:opacity-50"
      >
        Ban user
      </button>
      {error && <span className="text-sm font-semibold">{error}</span>}
    </div>
  );
}
