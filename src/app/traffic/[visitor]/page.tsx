import Link from "next/link";
import { notFound } from "next/navigation";
import { StatTile } from "@/components/charts";
import { AdminPage, LoadError } from "@/components/page";
import { requireAdmin } from "@/lib/admin";
import { formatDate, nycDay } from "@/lib/data";
import { buildVisitors, formatDuration, loadTraffic, pageLabel } from "@/lib/traffic";

export const metadata = { title: "Visitor" };

// One person's journey: every page they viewed, in order, grouped by day.
export default async function VisitorPage({ params }: PageProps<"/traffic/[visitor]">) {
  const { supabase } = await requireAdmin();
  const { visitor: id } = await params;
  const { views, profiles, error } = await loadTraffic(supabase);
  if (error) {
    return (
      <AdminPage title="Visitor">
        <LoadError message={error.message} />
      </AdminPage>
    );
  }

  const visitor = buildVisitors(views, profiles).find((v) => v.id === id);
  if (!visitor) notFound();

  const byDay = new Map<string, typeof visitor.views>();
  for (const v of [...visitor.views].reverse()) {
    const day = nycDay(v.started_at);
    byDay.set(day, [...(byDay.get(day) ?? []), v]);
  }

  return (
    <AdminPage
      title={visitor.name}
      subtitle={
        <>
          {visitor.signedIn ? visitor.email : "Not signed in"}
          {visitor.place && ` · ${visitor.place}`}
          {visitor.device && ` · ${visitor.device}, ${visitor.browser}`}
        </>
      }
    >
      <Link href="/traffic" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white">
        ← All visitors
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Page views" value={visitor.views.length} />
        <StatTile label="Time on site" value={formatDuration(visitor.totalMs)} />
        <StatTile label="First seen" value={formatDate(visitor.firstSeen)} />
        <StatTile label="Days visited" value={byDay.size} />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {[...byDay.entries()].map(([day, list]) => (
          <section key={day}>
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            <ol className="mt-2 divide-y divide-black/5 rounded-xl border border-black/10 bg-white dark:divide-white/10 dark:border-white/15 dark:bg-zinc-900">
              {list.map((v) => (
                <li key={v.id} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5 text-sm">
                  <span className="w-20 shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
                    {new Date(v.started_at).toLocaleTimeString("en-US", {
                      timeZone: "America/New_York",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-black dark:text-white">{pageLabel(v.path)}</span>
                  <span className="font-mono text-xs text-zinc-500">{v.path}</span>
                  {v.referrer && <span className="text-xs text-zinc-500">from {v.referrer}</span>}
                  <span className="ml-auto tabular-nums text-zinc-600 dark:text-zinc-400">{formatDuration(v.duration_ms)}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </AdminPage>
  );
}
