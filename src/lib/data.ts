import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_superadmin: boolean;
  created_at: string;
};

export type Post = {
  id: number;
  user_id: string;
  image_path: string;
  image_url: string;
  theme: string | null;
  created_at: string;
};

export type Caption = {
  id: number;
  post_id: number;
  created_by: string;
  content: string;
  source: "ai" | "human";
  style: string | null;
  prompt: string | null;
  model: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
};

export type Vote = {
  id: number;
  caption_id: number;
  user_id: string;
  vote: 1 | -1;
  created_at: string;
};

const LIMIT = 10_000;

// The whole (small) database, read as the signed-in superadmin. RLS only
// returns other users' profiles and votes because is_superadmin is true.
export async function loadAll(supabase: SupabaseClient) {
  const [profiles, posts, captions, votes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, avatar_url, is_superadmin, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("posts")
      .select("id, user_id, image_path, image_url, theme, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("captions")
      .select("id, post_id, created_by, content, source, style, prompt, model, upvotes, downvotes, created_at")
      .order("id", { ascending: true })
      .limit(LIMIT),
    supabase
      .from("caption_votes")
      .select("id, caption_id, user_id, vote, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  const error = profiles.error ?? posts.error ?? captions.error ?? votes.error;

  return {
    profiles: (profiles.data ?? []) as Profile[],
    posts: (posts.data ?? []) as Post[],
    captions: (captions.data ?? []) as Caption[],
    votes: (votes.data ?? []) as Vote[],
    error,
  };
}

export const score = (c: Pick<Caption, "upvotes" | "downvotes">) => c.upvotes - c.downvotes;

export function displayName(p: Profile | undefined) {
  if (!p) return "Unknown user";
  const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  return name || p.email || "Unnamed user";
}

export function byId<T extends { id: string | number }>(rows: T[]) {
  return new Map(rows.map((r) => [r.id, r] as const));
}

// Date in New York, e.g. "2026-10-22", so "today" matches the main app.
export function nycDay(iso: string | Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(iso));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
