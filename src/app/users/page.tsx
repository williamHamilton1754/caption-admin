import { Avatar } from "@/components/avatar";
import { AdminPage, LoadError } from "@/components/page";
import { requireAdmin } from "@/lib/admin";
import { displayName, formatDate, loadAll } from "@/lib/data";

export const metadata = { title: "Users" };

// READ users/profiles, with each person's activity.
export default async function UsersPage() {
  const { supabase } = await requireAdmin();
  const { profiles, posts, captions, votes, error } = await loadAll(supabase);
  if (error) {
    return (
      <AdminPage title="Users">
        <LoadError message={error.message} />
      </AdminPage>
    );
  }

  const count = <T,>(rows: T[], key: (r: T) => string) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
    return m;
  };
  const postCount = count(posts, (p) => p.user_id);
  const captionCount = count(
    captions.filter((c) => c.source === "human"),
    (c) => c.created_by,
  );
  const voteCount = count(votes, (v) => v.user_id);

  return (
    <AdminPage title="Users" subtitle={`${profiles.length} people have signed in to Caption the City.`}>
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Photos</th>
              <th className="px-4 py-3 text-right font-medium">Captions written</th>
              <th className="px-4 py-3 text-right font-medium">Votes cast</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar url={p.avatar_url} name={displayName(p)} size={32} />
                    <div>
                      <p className="font-medium text-black dark:text-white">{displayName(p)}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(p.created_at)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{postCount.get(p.id) ?? 0}</td>
                <td className="px-4 py-3 text-right tabular-nums">{captionCount.get(p.id) ?? 0}</td>
                <td className="px-4 py-3 text-right tabular-nums">{voteCount.get(p.id) ?? 0}</td>
                <td className="px-4 py-3">
                  {p.is_superadmin ? (
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-black">
                      Superadmin
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">User</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
