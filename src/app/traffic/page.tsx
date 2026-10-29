import Link from "next/link";
import { BarList, ChartCard, ColumnChart, StatTile } from "@/components/charts";
import { AdminPage, LoadError } from "@/components/page";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/data";
import { buildVisitors, formatDuration, loadTraffic, pageLabel, trafficStats } from "@/lib/traffic";

export const metadata = { title: "Traffic" };

// Who visited Caption the City, what they looked at, and for how long.
export default async function TrafficPage() {
  const { supabase } = await requireAdmin();
  const { views, profiles, error } = await loadTraffic(supabase);
  if (error) {
    return (
      <AdminPage title="Traffic">
        <LoadError message={error.message} />
      </AdminPage>
    );
  }

  const visitors = buildVisitors(views, profiles);
  const s = trafficStats(views, visitors);
  const visitorById = new Map(visitors.flatMap((p) => p.views.map((v) => [v.id, p] as const)));

  return (
    <AdminPage title="Traffic" subtitle="Who visited Caption the City in the last 30 days, what they looked at, and for how long.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Page views" value={s.totals.views} hint={`${s.totals.viewsLastWeek} in the last 7 days`} />
        <StatTile
          label="Visitors"
          value={s.totals.visitors}
          hint={`${s.totals.signedIn} signed in · ${s.totals.returning} came back another day`}
        />
        <StatTile label="Avg. time on a page" value={formatDuration(s.totals.avgMs)} hint="Only while the tab was visible" />
        <StatTile label="Total time on site" value={formatDuration(s.totals.totalMs)} hint="Across all visitors" />
      </div>

      {views.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
          No visits recorded yet. Open the main app in another tab and click around, then refresh this page.
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Page views per day" subtitle="Last 14 days · hover a bar for the count">
          <ColumnChart data={s.viewsByDay} unit="page views" />
        </ChartCard>
        <ChartCard title="Visitors per day" subtitle="Different people each day · hover a bar">
          <ColumnChart data={s.visitorsByDay} unit="visitors" />
        </ChartCard>

        <ChartCard title="What people look at" subtitle="Views per page, with average time spent">
          <BarList
            rows={s.pages.slice(0, 8).map((p) => ({ label: p.label, value: p.count, note: `avg ${formatDuration(p.avgMs)}` }))}
          />
        </ChartCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChartCard title="Devices">
            <BarList rows={s.devices} />
          </ChartCard>
          <ChartCard title="Browsers">
            <BarList rows={s.browsers.slice(0, 4)} />
          </ChartCard>
          <ChartCard title="Where they are">
            <BarList rows={s.places.slice(0, 5)} />
          </ChartCard>
          <ChartCard title="Came from">
            <BarList rows={s.referrers.slice(0, 5)} emptyText="Direct visits only so far" />
          </ChartCard>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-black dark:text-white">Visitors</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Click anyone to see every page they viewed, in order.</p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-900">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Visitor</th>
              <th className="px-4 py-3 font-medium">Last seen</th>
              <th className="px-4 py-3 text-right font-medium">Pages</th>
              <th className="px-4 py-3 text-right font-medium">Time on site</th>
              <th className="px-4 py-3 font-medium">Looked at most</th>
              <th className="px-4 py-3 font-medium">Device · Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {visitors.map((v) => (
              <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <Link href={`/traffic/${v.id}`} className="font-medium text-black hover:underline dark:text-white">
                    {v.name}
                  </Link>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{v.signedIn ? v.email : "Not signed in"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(v.lastSeen)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{v.views.length}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatDuration(v.totalMs)}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {v.topPages.map((p) => `${p.path} (${p.count})`).join(", ")}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {[v.device, v.browser].filter(Boolean).join(" · ")}
                  {v.place && <p className="text-xs">{v.place}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-black dark:text-white">Recent page views</h2>
      <ul className="mt-3 divide-y divide-black/5 rounded-xl border border-black/10 bg-white dark:divide-white/10 dark:border-white/15 dark:bg-zinc-900">
        {views.slice(0, 25).map((view) => {
          const person = visitorById.get(view.id);
          return (
            <li key={view.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <span className="w-32 shrink-0 text-zinc-500 dark:text-zinc-400">{formatDate(view.started_at)}</span>
              <Link href={`/traffic/${person?.id}`} className="font-medium text-black hover:underline dark:text-white">
                {person?.name}
              </Link>
              <span className="text-zinc-600 dark:text-zinc-400">
                viewed <span className="text-black dark:text-white">{pageLabel(view.path)}</span>
                {view.path !== "/" && <span className="font-mono text-xs"> {view.path}</span>}
              </span>
              <span className="ml-auto tabular-nums text-zinc-500 dark:text-zinc-400">{formatDuration(view.duration_ms)}</span>
            </li>
          );
        })}
      </ul>
    </AdminPage>
  );
}
