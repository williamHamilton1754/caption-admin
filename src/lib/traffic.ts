import type { SupabaseClient } from "@supabase/supabase-js";
import { byId, displayName, nycDay, type Profile } from "./data";

export type PageView = {
  id: string;
  visitor_id: string;
  user_id: string | null;
  path: string;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  duration_ms: number;
  started_at: string;
};

export type Visitor = {
  id: string;
  name: string;
  email: string | null;
  signedIn: boolean;
  views: PageView[];
  totalMs: number;
  firstSeen: string;
  lastSeen: string;
  device: string | null;
  browser: string | null;
  place: string | null;
  topPages: { path: string; count: number }[];
};

const DAYS = 14;

// Page views from the last 30 days (superadmins only, enforced by RLS).
export async function loadTraffic(supabase: SupabaseClient) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [views, profiles] = await Promise.all([
    supabase
      .from("page_views")
      .select("id, visitor_id, user_id, path, referrer, device, browser, country, city, duration_ms, started_at")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(20_000),
    supabase.from("profiles").select("id, email, first_name, last_name, avatar_url, is_superadmin, created_at"),
  ]);
  return {
    views: (views.data ?? []) as PageView[],
    profiles: (profiles.data ?? []) as Profile[],
    error: views.error ?? profiles.error,
  };
}

// "/posts/12" and "/posts/40" are the same kind of page.
export function pageLabel(path: string) {
  if (path === "/") return "Home feed";
  if (/^\/posts\/\d+/.test(path)) return "A post";
  const names: Record<string, string> = {
    "/create": "Post a photo",
    "/dashboard": "My stats",
    "/profile": "Profile",
    "/login": "Sign in",
    "/welcome": "Welcome",
    "/jokes": "Jokes",
    "/privacy": "Privacy",
  };
  return names[path] ?? path;
}

export function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function placeOf(v: PageView) {
  return [v.city, v.country].filter(Boolean).join(", ") || null;
}

// Group views into people. Signed-in views are grouped by account; everything
// else by the anonymous browser ID.
export function buildVisitors(views: PageView[], profiles: Profile[]): Visitor[] {
  const people = byId(profiles);
  const accountByVisitor = new Map<string, string>();
  for (const v of views) if (v.user_id) accountByVisitor.set(v.visitor_id, v.user_id);

  const groups = new Map<string, PageView[]>();
  for (const v of views) {
    const key = v.user_id ?? accountByVisitor.get(v.visitor_id) ?? v.visitor_id;
    groups.set(key, [...(groups.get(key) ?? []), v]);
  }

  return [...groups.entries()]
    .map(([id, list]) => {
      const profile = people.get(id);
      const sorted = [...list].sort((a, b) => a.started_at.localeCompare(b.started_at));
      const counts = new Map<string, number>();
      for (const v of list) counts.set(pageLabel(v.path), (counts.get(pageLabel(v.path)) ?? 0) + 1);
      const latest = sorted[sorted.length - 1];
      return {
        id,
        name: profile ? displayName(profile) : `Anonymous visitor ${id.slice(0, 6)}`,
        email: profile?.email ?? null,
        signedIn: Boolean(profile),
        views: sorted,
        totalMs: list.reduce((sum, v) => sum + v.duration_ms, 0),
        firstSeen: sorted[0].started_at,
        lastSeen: latest.started_at,
        device: latest.device,
        browser: latest.browser,
        place: placeOf(latest),
        topPages: [...counts.entries()]
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
      };
    })
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export function trafficStats(views: PageView[], visitors: Visitor[]) {
  const weekAgo = Date.now() - 7 * 86_400_000;
  const lastWeek = views.filter((v) => new Date(v.started_at).getTime() >= weekAgo);
  const timed = views.filter((v) => v.duration_ms > 0);

  const days = Array.from({ length: DAYS }, (_, i) => nycDay(new Date(Date.now() - (DAYS - 1 - i) * 86_400_000)));
  const viewsByDay = new Map<string, number>();
  const visitorsByDay = new Map<string, Set<string>>();
  for (const v of views) {
    const d = nycDay(v.started_at);
    viewsByDay.set(d, (viewsByDay.get(d) ?? 0) + 1);
    visitorsByDay.set(d, (visitorsByDay.get(d) ?? new Set()).add(v.user_id ?? v.visitor_id));
  }

  const pages = new Map<string, { count: number; ms: number }>();
  for (const v of views) {
    const p = pages.get(pageLabel(v.path)) ?? { count: 0, ms: 0 };
    pages.set(pageLabel(v.path), { count: p.count + 1, ms: p.ms + v.duration_ms });
  }

  const tally = (key: (v: PageView) => string | null) => {
    const m = new Map<string, number>();
    for (const v of views) {
      const k = key(v) ?? "Unknown";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };

  const referrers = tally((v) => {
    if (!v.referrer) return null;
    try {
      return new URL(v.referrer).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }).filter((r) => r.label !== "Unknown");

  return {
    totals: {
      views: views.length,
      viewsLastWeek: lastWeek.length,
      visitors: visitors.length,
      signedIn: visitors.filter((v) => v.signedIn).length,
      avgMs: timed.length ? timed.reduce((s, v) => s + v.duration_ms, 0) / timed.length : 0,
      totalMs: views.reduce((s, v) => s + v.duration_ms, 0),
      returning: visitors.filter((v) => new Set(v.views.map((x) => nycDay(x.started_at))).size > 1).length,
    },
    viewsByDay: days.map((day) => ({ day, count: viewsByDay.get(day) ?? 0 })),
    visitorsByDay: days.map((day) => ({ day, count: visitorsByDay.get(day)?.size ?? 0 })),
    pages: [...pages.entries()]
      .map(([label, p]) => ({ label, count: p.count, avgMs: p.ms / p.count }))
      .sort((a, b) => b.count - a.count),
    devices: tally((v) => v.device),
    browsers: tally((v) => v.browser),
    places: tally((v) => (v.country ? [v.city, v.country].filter(Boolean).join(", ") : null)),
    referrers,
  };
}
