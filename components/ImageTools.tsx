"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteImage } from "@/lib/admin/images";
import { inputClass, outlineClass, primaryClass } from "@/components/Forms";

const BUCKET = "moments";
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function check(file: File): string | null {
  if (!TYPES.includes(file.type)) return "Use a JPEG, PNG, or WebP.";
  if (file.size > MAX_BYTES) return "Keep it under 5 MB.";
  return null;
}

// Upload goes straight from the browser to storage under the admin's own folder, so the
// main app's generate page can use it as a pre-uploaded photo.
export function UploadImage({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload() {
    if (!file) return;
    const problem = check(file);
    if (problem) {
      setStatus(problem);
      return;
    }
    setStatus(null);
    startTransition(async () => {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${adminId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient().storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (error) {
        setStatus(`Upload failed: ${error.message}`);
        return;
      }
      setFile(null);
      setStatus("Uploaded.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input type="file" accept={TYPES.join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      <button type="button" disabled={pending || !file} onClick={upload} className={primaryClass}>
        Upload
      </button>
      {status && <span className="text-sm">{status}</span>}
    </div>
  );
}

export function ImageRowTools({
  path,
  isMine,
  usedByMomentId,
  generateUrl,
}: {
  path: string;
  isMine: boolean;
  usedByMomentId: string | null;
  generateUrl: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function replace(file: File) {
    const problem = check(file);
    if (problem) {
      setStatus(problem);
      return;
    }
    setStatus(null);
    startTransition(async () => {
      const { error } = await createClient()
        .storage.from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      setStatus(error ? `Replace failed: ${error.message}` : "Replaced. Cached copies may take a minute.");
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Delete this photo from storage?")) return;
    setStatus(null);
    startTransition(async () => {
      const result = await deleteImage(path);
      setStatus(result.ok ? null : result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {usedByMomentId ? (
        <a href={`/moments/${usedByMomentId}`} className="underline">moment</a>
      ) : isMine ? (
        <a href={generateUrl} target="_blank" rel="noreferrer" className={outlineClass + " px-2 py-1 text-xs"}>
          Generate captions
        </a>
      ) : (
        <span className="text-neutral-600">unused</span>
      )}
      <label className={outlineClass + " cursor-pointer px-2 py-1 text-xs"}>
        Replace
        <input type="file" accept={TYPES.join(",")} className={inputClass + " sr-only"} onChange={(e) => e.target.files?.[0] && replace(e.target.files[0])} disabled={pending} />
      </label>
      {!usedByMomentId && (
        <button type="button" disabled={pending} onClick={remove} className={outlineClass + " px-2 py-1 text-xs"}>
          Delete
        </button>
      )}
      {status && <span className="font-semibold">{status}</span>}
    </div>
  );
}
