export function AdminPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </main>
  );
}

export function LoadError({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      Couldn&apos;t load data: {message}
    </p>
  );
}

export function SourceBadge({ source }: { source: "ai" | "human" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: source === "ai" ? "var(--series-1)" : "var(--series-2)" }}
      />
      {source === "ai" ? "AI" : "Human"}
    </span>
  );
}
