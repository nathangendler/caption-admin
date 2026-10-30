"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/admin/crud";

// Shared bits for the small CRUD forms: one submit handler and one error line.
export function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<ActionResult>, after?: () => void) {
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
  return { run, pending, error };
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  );
}

export const inputClass = "rounded border border-black px-2 py-1 text-sm";
export const primaryClass = "rounded bg-black px-3 py-1.5 text-sm text-white hover:opacity-70 disabled:opacity-50";
export const outlineClass =
  "rounded border border-black bg-white px-3 py-1.5 text-sm text-black hover:opacity-70 disabled:opacity-50";

export function DeleteButton({
  label,
  confirmText,
  onDelete,
}: {
  label?: string;
  confirmText: string;
  onDelete: () => Promise<ActionResult>;
}) {
  const { run, pending, error } = useAction();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(confirmText)) run(onDelete);
        }}
        className={outlineClass + " px-2 py-1 text-xs"}
      >
        {label ?? "Delete"}
      </button>
      {error && <span className="text-xs font-semibold">{error}</span>}
    </span>
  );
}
