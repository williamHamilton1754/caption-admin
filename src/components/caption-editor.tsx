"use client";

import { useState, useTransition } from "react";
import { deleteCaption, updateCaption } from "@/app/actions";

export function CaptionEditor({ id, content }: { id: number; content: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(content);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true } | { error: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) setError(result.error);
      else after?.();
    });
  }

  const linkButton = "text-xs font-medium underline-offset-2 hover:underline disabled:opacity-50";

  return (
    <div className="min-w-0 flex-1">
      {editing ? (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
            disabled={pending}
            aria-label="Caption text"
            className="min-w-0 flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-black dark:border-white/20 dark:text-white dark:focus:border-white"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => updateCaption(id, text), () => setEditing(false))}
            className="rounded-lg bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setText(content);
              setEditing(false);
            }}
            className="px-1 text-sm text-zinc-500"
          >
            Cancel
          </button>
        </div>
      ) : (
        <p className="text-sm text-black dark:text-zinc-100">{content}</p>
      )}

      {!editing && (
        <div className="mt-1 flex gap-3 text-zinc-500 dark:text-zinc-400">
          <button type="button" className={linkButton} disabled={pending} onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            className={`${linkButton} text-red-600 dark:text-red-400`}
            onClick={() => {
              if (confirm("Delete this caption and its votes?")) run(() => deleteCaption(id));
            }}
          >
            {pending ? "Working…" : "Delete"}
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
