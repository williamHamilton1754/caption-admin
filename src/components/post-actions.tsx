"use client";

import { useState, useTransition } from "react";
import { deletePost, generateCaptions } from "@/app/actions";
import { STYLES, type StyleKey } from "@/lib/captions";

export function PostActions({ postId }: { postId: number }) {
  const [style, setStyle] = useState<StyleKey>("columbia");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"generate" | "delete" | null>(null);
  const [, startTransition] = useTransition();

  function run(kind: "generate" | "delete", action: () => Promise<{ ok: true } | { error: string }>) {
    setError(null);
    setBusy(kind);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) setError(result.error);
      setBusy(null);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-black/5 px-4 py-3 dark:border-white/10">
      <select
        value={style}
        onChange={(e) => setStyle(e.target.value as StyleKey)}
        disabled={busy !== null}
        aria-label="AI caption voice"
        className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm text-black dark:border-white/20 dark:bg-zinc-900 dark:text-white"
      >
        {(Object.keys(STYLES) as StyleKey[]).map((key) => (
          <option key={key} value={key}>
            {STYLES[key].label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => run("generate", () => generateCaptions(postId, style))}
        className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {busy === "generate" ? "Generating…" : "✨ Generate 3 AI captions"}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => {
          if (confirm("Delete this post, its photo, all its captions and votes? This can't be undone.")) {
            run("delete", () => deletePost(postId));
          }
        }}
        className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        {busy === "delete" ? "Deleting…" : "Delete post"}
      </button>
      {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
