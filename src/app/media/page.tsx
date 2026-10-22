import Image from "next/image";
import { CaptionEditor } from "@/components/caption-editor";
import { AdminPage, LoadError, SourceBadge } from "@/components/page";
import { PostActions } from "@/components/post-actions";
import { requireAdmin } from "@/lib/admin";
import { byId, displayName, formatDate, loadAll, score } from "@/lib/data";
import { voiceLabel } from "@/lib/stats";

export const metadata = { title: "AI media" };

// CREATE / READ / UPDATE / DELETE photos and their AI captions.
export default async function MediaPage() {
  const { supabase } = await requireAdmin();
  const { profiles, posts, captions, error } = await loadAll(supabase);
  if (error) {
    return (
      <AdminPage title="AI media">
        <LoadError message={error.message} />
      </AdminPage>
    );
  }

  const people = byId(profiles);

  return (
    <AdminPage
      title="AI media"
      subtitle="Every photo with its captions. Generate new AI captions, edit any caption, or delete captions and posts."
    >
      {posts.length === 0 && <p className="text-zinc-600 dark:text-zinc-400">No posts yet.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        {posts.map((post) => {
          const list = captions
            .filter((c) => c.post_id === post.id)
            .sort((a, b) => score(b) - score(a));
          return (
            <article
              key={post.id}
              className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-900"
            >
              <div className="flex gap-4 p-4">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Image src={post.image_url} alt={`Post ${post.id}`} fill sizes="112px" className="object-cover" />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-black dark:text-white">Post #{post.id}</p>
                  <p className="text-zinc-600 dark:text-zinc-400">by {displayName(people.get(post.user_id))}</p>
                  <p className="text-zinc-500 dark:text-zinc-400">{formatDate(post.created_at)}</p>
                  {post.theme && <p className="mt-1 text-xs text-zinc-500">#{post.theme}</p>}
                </div>
              </div>

              <ul className="divide-y divide-black/5 border-t border-black/5 dark:divide-white/10 dark:border-white/10">
                {list.length === 0 && <li className="px-4 py-3 text-sm text-zinc-500">No captions.</li>}
                {list.map((c) => (
                  <li key={c.id} className="flex gap-3 px-4 py-3">
                    <div className="w-14 shrink-0 text-center">
                      <p className="font-semibold tabular-nums text-black dark:text-white">{score(c)}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        ▲{c.upvotes} ▼{c.downvotes}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <CaptionEditor id={c.id} content={c.content} />
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <SourceBadge source={c.source} />
                        {c.source === "ai"
                          ? `${voiceLabel(c.style)} · ${c.model ?? "unknown model"}`
                          : `by ${displayName(people.get(c.created_by))}`}
                      </p>
                      {c.prompt && (
                        <details className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <summary className="cursor-pointer">Prompt</summary>
                          <p className="mt-1 whitespace-pre-wrap font-mono">{c.prompt}</p>
                        </details>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <PostActions postId={post.id} />
            </article>
          );
        })}
      </div>
    </AdminPage>
  );
}
