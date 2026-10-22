// Small server-rendered charts. Colors come from --series-* in globals.css;
// text always uses text colors, never the series color.

export function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-black dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
      <h2 className="font-medium text-black dark:text-white">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Vertical columns for a daily count. One series, so no legend; hover any day for its value.
export function ColumnChart({
  data,
  unit,
}: {
  data: { day: string; count: number }[];
  unit: string;
}) {
  const width = 560;
  const height = 140;
  const top = 18;
  const bottom = 20;
  const plot = height - top - bottom;
  const max = Math.max(1, ...data.map((d) => d.count));
  const slot = width / data.length;
  const barWidth = Math.max(4, slot - 6);
  const peak = data.reduce((best, d) => (d.count > best.count ? d : best), data[0]);
  const shortDay = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${unit} per day, last ${data.length} days`}>
      <line x1={0} x2={width} y1={top + plot} y2={top + plot} stroke="var(--chart-grid)" strokeWidth={1} />
      {data.map((d, i) => {
        const h = (d.count / max) * plot;
        const x = i * slot + (slot - barWidth) / 2;
        const y = top + plot - h;
        return (
          <g key={d.day}>
            <title>{`${shortDay(d.day)}: ${d.count} ${unit}`}</title>
            {/* Hit target: the whole column, larger than the bar. */}
            <rect x={i * slot} y={0} width={slot} height={top + plot} fill="transparent" />
            {h > 0 && (
              <path
                d={`M${x},${top + plot} V${y + Math.min(4, h)} Q${x},${y} ${x + Math.min(4, barWidth / 2)},${y} H${x + barWidth - Math.min(4, barWidth / 2)} Q${x + barWidth},${y} ${x + barWidth},${y + Math.min(4, h)} V${top + plot} Z`}
                fill="var(--series-1)"
              />
            )}
            {d === peak && d.count > 0 && (
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="fill-zinc-700 text-[11px] dark:fill-zinc-300">
                {d.count}
              </text>
            )}
          </g>
        );
      })}
      {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
        <text
          key={i}
          x={i * slot + slot / 2}
          y={height - 4}
          textAnchor="middle"
          className="fill-zinc-500 text-[11px] dark:fill-zinc-400"
        >
          {shortDay(data[i].day)}
        </text>
      ))}
    </svg>
  );
}

// Horizontal bars for a few labeled categories, each with its value written at the end.
export function BarList({
  rows,
  format = (v: number) => String(v),
  emptyText = "No data yet",
}: {
  rows: { label: string; value: number; note?: string }[];
  format?: (v: number) => string;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyText}</p>;
  }
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 0.0001);

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${format(r.value)}${r.note ? ` (${r.note})` : ""}`}>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">{r.label}</span>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {format(r.value)}
              {r.note && <span className="ml-1 text-xs">· {r.note}</span>}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-2 rounded-r-full"
              style={{
                width: `${(Math.max(0, r.value) / max) * 100}%`,
                background: "var(--series-1)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Two-part split (AI vs Human), with a legend and the counts written out.
export function SplitBar({ ai, human, unit }: { ai: number; human: number; unit: string }) {
  const total = ai + human;
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {total > 0 && ai > 0 && (
          <div title={`AI: ${ai} ${unit}`} style={{ width: `${(ai / total) * 100}%`, background: "var(--series-1)" }} />
        )}
        {total > 0 && human > 0 && (
          <div title={`Human: ${human} ${unit}`} style={{ width: `${(human / total) * 100}%`, background: "var(--series-2)" }} />
        )}
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-1)" }} />
          AI <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{ai}</span>
        </span>
        <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          Human <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{human}</span>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-2)" }} />
        </span>
      </div>
    </div>
  );
}
