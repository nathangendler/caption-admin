"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addCaption, deleteMoment, updateNote } from "@/lib/admin/actions";

export function AddCaptionForm({ momentId }: { momentId: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addCaption(momentId, text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setText("");
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={300}
        placeholder="Add a caption to this moment"
        className="input text-[14px]"
      />
      <button type="submit" disabled={pending || !text.trim()} className="btn-primary shrink-0">
        Add caption
      </button>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </form>
  );
}

export function NoteEditor({ momentId, note }: { momentId: string; note: string | null }) {
  const [value, setValue] = useState(note ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setStatus(null);
    startTransition(async () => {
      const result = await updateNote(momentId, value);
      setStatus(result.ok ? "Saved." : result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="note" className="label">
        User&apos;s note
      </label>
      <textarea
        id="note"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={2}
        maxLength={200}
        className="input text-[14px]"
      />
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn-outline btn-sm">
          Save note
        </button>
        {status && <span className="text-[12px] text-subtle">{status}</span>}
      </div>
    </div>
  );
}

export function DeleteMomentButton({ momentId }: { momentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Delete this moment, its photo, captions, picks, and likes? This cannot be undone.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteMoment(momentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/moments");
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={remove} disabled={pending} className="btn-outline text-danger">
        Delete moment
      </button>
      {error && <span className="text-[12px] text-danger">{error}</span>}
    </div>
  );
}
