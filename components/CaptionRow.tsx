"use client";

import { useState, useTransition } from "react";
import { deleteCaption, setWinner, updateCaption } from "@/lib/admin/actions";

export function CaptionRow({
  momentId,
  captionId,
  position,
  text,
  isWinner,
  wins,
}: {
  momentId: string;
  captionId: string;
  position: number;
  text: string;
  isWinner: boolean;
  wins: number;
}) {
  const [draft, setDraft] = useState(text);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      after?.();
    });
  }

  return (
    <li className={`flex flex-col gap-2 p-3 ${isWinner ? "bg-accent/10" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="w-6 shrink-0 text-[11px] font-bold text-muted">#{position}</span>
        {editing ? (
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            maxLength={300}
            className="input text-[14px]"
          />
        ) : (
          <p className="flex-1 text-[14px] text-ink">{text}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-9 text-[11px]">
        {isWinner ? (
          <span className="rounded-full bg-ink px-2 py-0.5 font-bold text-cream">Posted winner</span>
        ) : (
          <span className="text-muted">{wins} ladder {wins === 1 ? "win" : "wins"}</span>
        )}
        {editing ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => updateCaption(captionId, draft), () => setEditing(false))}
              className="btn-primary btn-sm"
            >
              Save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setDraft(text);
                setEditing(false);
              }}
              className="btn-outline btn-sm"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={pending} onClick={() => setEditing(true)} className="btn-outline btn-sm">
              Edit
            </button>
            {!isWinner && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setWinner(momentId, captionId))}
                className="btn-outline btn-sm"
              >
                Make winner
              </button>
            )}
            {!isWinner && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Delete this caption?")) run(() => deleteCaption(captionId));
                }}
                className="btn-outline btn-sm text-danger"
              >
                Delete
              </button>
            )}
          </>
        )}
        {error && <span className="text-danger">{error}</span>}
      </div>
    </li>
  );
}
