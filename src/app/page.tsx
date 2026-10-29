import { BarList, ChartCard, ColumnChart, SplitBar, StatTile } from "@/components/charts";
import { AdminPage, LoadError, SourceBadge } from "@/components/page";
import { requireAdmin } from "@/lib/admin";
import { loadAll, score } from "@/lib/data";
import { computeStats, voiceLabel } from "@/lib/stats";

export const metadata = { title: "Dashboard" };

const pct = (n: number) => `${Math.round(n * 100)}%`;
const signed = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const data = await loadAll(supabase);
  if (data.error) {
    return (
      <AdminPage title="Dashboard">
        <LoadError message={data.error.message} />
      </AdminPage>
    );
  }

  const s = computeStats(data);
  const { totals, humansVsAi } = s;
  const leader =
    humansVsAi.humanWins === humansVsAi.aiWins
      ? "It's a tie"
      : humansVsAi.humanWins > humansVsAi.aiWins
        ? "Humans are winning"
        : "The AI is winning";

  return (
    <AdminPage title="Dashboard" subtitle="Everything happening on Caption the City, at a glance.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Users" value={totals.users} hint={`${totals.admins} superadmin${totals.admins === 1 ? "" : "s"}`} />
        <StatTile label="Photos posted" value={totals.posts} hint={`${pct(totals.votedPostShare)} have at least one vote`} />
        <StatTile
          label="Captions"
          value={totals.aiCaptions + totals.humanCaptions}
          hint={`${totals.aiCaptions} AI · ${totals.humanCaptions} human`}
        />
        <StatTile label="Votes cast" value={totals.votes} hint={`${pct(totals.upvoteRate)} are upvotes`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title={`Humans vs AI: ${leader}`} subtitle="Who holds the 👑 (top caption) on each post">
          <SplitBar ai={humansVsAi.aiWins} human={humansVsAi.humanWins} unit="posts won" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Average caption score: AI <strong className="text-black dark:text-white">{signed(humansVsAi.aiAvg)}</strong>
            {" · "}Human <strong className="text-black dark:text-white">{signed(humansVsAi.humanAvg)}</strong>
          </p>
        </ChartCard>

        <ChartCard title="Which AI voice is funniest?" subtitle="Average score of AI captions, by voice">
          <BarList
            rows={[...s.voices]
              .sort((a, b) => b.avgScore - a.avgScore)
              .map((v) => ({ label: v.label, value: v.avgScore, note: `${v.count} captions` }))}
            format={signed}
          />
        </ChartCard>

        <ChartCard title="Photos posted per day" subtitle="Last 14 days · hover a bar for the count">
          <ColumnChart data={s.postsByDay} unit="photos" />
        </ChartCard>

        <ChartCard title="Votes cast per day" subtitle="Last 14 days · hover a bar for the count">
          <ColumnChart data={s.votesByDay} unit="votes" />
        </ChartCard>

        <ChartCard title="Most popular daily themes" subtitle="Photos posted under each theme">
          <BarList rows={s.themes.slice(0, 6).map((t) => ({ label: t.label, value: t.count }))} />
        </ChartCard>

        <ChartCard title="Most active voters" subtitle="Votes cast per person">
          <BarList rows={s.topVoters.map((v) => ({ label: v.email ? `${v.name} · ${v.email}` : v.name, value: v.count }))} emptyText="No votes yet" />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="🏆 Top captions of all time">
          <ol className="flex flex-col gap-3">
            {s.topCaptions.length === 0 && <li className="text-sm text-zinc-500">No captions yet</li>}
            {s.topCaptions.map((c, i) => (
              <li key={c.id} className="flex gap-3 text-sm">
                <span className="w-5 shrink-0 font-semibold tabular-nums text-zinc-400">{i + 1}</span>
                <div>
                  <p className="text-black dark:text-zinc-100">{c.content}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <SourceBadge source={c.source} />
                    {signed(score(c))} points
                    {c.source === "ai" && ` · ${voiceLabel(c.style)}`}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </ChartCard>

        <ChartCard title="🔥 Most controversial" subtitle="Lots of upvotes and downvotes">
          {s.controversial ? (
            <div className="text-sm">
              <p className="text-black dark:text-zinc-100">“{s.controversial.content}”</p>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                ▲ {s.controversial.upvotes} up · ▼ {s.controversial.downvotes} down
              </p>
              <div className="mt-2">
                <SourceBadge source={s.controversial.source} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No caption has both upvotes and downvotes yet.
            </p>
          )}
        </ChartCard>

        <ChartCard title="😂 Funniest human" subtitle="Highest total score on their own captions">
          {s.funniest ? (
            <div>
              <p className="text-2xl font-semibold text-black dark:text-white">{s.funniest.name}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{signed(s.funniest.score)} total points</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No human caption has a positive score yet.</p>
          )}
        </ChartCard>
      </div>
    </AdminPage>
  );
}
