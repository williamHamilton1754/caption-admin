import Link from "next/link";
import { StatTile } from "@/components/charts";
import { AdminPage, LoadError, SourceBadge } from "@/components/page";
import { requireAdmin } from "@/lib/admin";
import { byId, displayName, formatDate, loadAll } from "@/lib/data";

export const metadata = { title: "Votes" };

const FILTERS = [
  { key: "all", label: "All votes" },
  { key: "up", label: "▲ Upvotes" },
  { key: "down", label: "▼ Downvotes" },
] as const;

// READ every upvote/downvote: who, what, and when.
export default async function VotesPage({ searchParams }: PageProps<"/votes">) {
  const { supabase } = await requireAdmin();
  const { profiles, captions, votes, error } = await loadAll(supabase);
  if (error) {
    return (
      <AdminPage title="Votes">
        <LoadError message={error.message} />
      </AdminPage>
    );
  }

  const { type } = await searchParams;
  const filter = FILTERS.some((f) => f.key === type) ? (type as (typeof FILTERS)[number]["key"]) : "all";
  const shown = votes.filter((v) => filter === "all" || (filter === "up" ? v.vote === 1 : v.vote === -1));
  const people = byId(profiles);
  const captionById = byId(captions);
  const up = votes.filter((v) => v.vote === 1).length;

  return (
    <AdminPage title="Votes" subtitle="Every upvote and downvote, newest first.">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Total votes" value={votes.length} />
        <StatTile label="Upvotes" value={up} />
        <StatTile label="Downvotes" value={votes.length - up} />
      </div>

      <nav className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/votes" : `/votes?type=${f.key}`}
            className={`rounded-full px-4 py-1.5 text-sm ${
              filter === f.key
                ? "bg-foreground text-background"
                : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Voter</th>
              <th className="px-4 py-3 font-medium">Vote</th>
              <th className="px-4 py-3 font-medium">Caption</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {shown.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  No votes yet.
                </td>
              </tr>
            )}
            {shown.map((v) => {
              const caption = captionById.get(v.caption_id);
              return (
                <tr key={v.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(v.created_at)}</td>
                  <td className="px-4 py-3 text-black dark:text-white">{displayName(people.get(v.user_id))}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-black dark:text-white">
                    {v.vote === 1 ? "▲ Upvote" : "▼ Downvote"}
                  </td>
                  <td className="px-4 py-3">
                    {caption ? (
                      <div>
                        <p className="text-black dark:text-zinc-100">{caption.content}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                          <SourceBadge source={caption.source} /> Post #{caption.post_id}
                        </p>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Deleted caption</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
