import { STYLES, isStyleKey } from "./captions";
import { byId, displayName, nycDay, score, type Caption, type Post, type Profile, type Vote } from "./data";

const DAYS = 14;

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function computeStats({
  profiles,
  posts,
  captions,
  votes,
}: {
  profiles: Profile[];
  posts: Post[];
  captions: Caption[];
  votes: Vote[];
}) {
  const people = byId(profiles);
  const ai = captions.filter((c) => c.source === "ai");
  const human = captions.filter((c) => c.source === "human");
  const upvotes = votes.filter((v) => v.vote === 1).length;

  // Humans vs AI: who holds the top spot on each post (a clear leader with a positive score).
  const byPost = new Map<number, Caption[]>();
  for (const c of captions) {
    byPost.set(c.post_id, [...(byPost.get(c.post_id) ?? []), c]);
  }
  let humanWins = 0;
  let aiWins = 0;
  for (const list of byPost.values()) {
    const [first, second] = [...list].sort((a, b) => score(b) - score(a));
    if (first && score(first) > 0 && (!second || score(first) > score(second))) {
      if (first.source === "human") humanWins++;
      else aiWins++;
    }
  }

  // Which AI voice gets the best reception?
  const voices = Object.entries(STYLES).map(([key, style]) => {
    const list = ai.filter((c) => c.style === key);
    return { label: style.label, count: list.length, avgScore: average(list.map(score)) };
  });

  // Posts per daily theme.
  const themeCounts = new Map<string, number>();
  for (const p of posts) {
    const theme = p.theme ?? "No theme";
    themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
  }
  const themes = [...themeCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Activity over the last 14 days (New York time).
  const days = Array.from({ length: DAYS }, (_, i) => nycDay(new Date(Date.now() - (DAYS - 1 - i) * 86_400_000)));
  const countByDay = (dates: string[]) => {
    const counts = new Map<string, number>();
    for (const d of dates) counts.set(nycDay(d), (counts.get(nycDay(d)) ?? 0) + 1);
    return days.map((day) => ({ day, count: counts.get(day) ?? 0 }));
  };

  // Standouts.
  const topCaptions = [...captions].sort((a, b) => score(b) - score(a)).slice(0, 5);
  const controversial = [...captions]
    .filter((c) => c.upvotes > 0 && c.downvotes > 0)
    .sort((a, b) => Math.min(b.upvotes, b.downvotes) - Math.min(a.upvotes, a.downvotes) || b.upvotes + b.downvotes - (a.upvotes + a.downvotes))[0];

  const votesByUser = new Map<string, number>();
  for (const v of votes) votesByUser.set(v.user_id, (votesByUser.get(v.user_id) ?? 0) + 1);
  const topVoters = [...votesByUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ name: displayName(people.get(id)), email: people.get(id)?.email ?? undefined, count }));

  const humanScoreByUser = new Map<string, number>();
  for (const c of human) humanScoreByUser.set(c.created_by, (humanScoreByUser.get(c.created_by) ?? 0) + score(c));
  const funniest = [...humanScoreByUser.entries()].sort((a, b) => b[1] - a[1])[0];

  const postsWithVotes = new Set(
    votes.map((v) => captions.find((c) => c.id === v.caption_id)?.post_id).filter((id) => id !== undefined),
  );

  return {
    totals: {
      users: profiles.length,
      admins: profiles.filter((p) => p.is_superadmin).length,
      posts: posts.length,
      aiCaptions: ai.length,
      humanCaptions: human.length,
      votes: votes.length,
      upvoteRate: votes.length ? upvotes / votes.length : 0,
      votedPostShare: posts.length ? postsWithVotes.size / posts.length : 0,
    },
    humansVsAi: {
      humanWins,
      aiWins,
      humanAvg: average(human.map(score)),
      aiAvg: average(ai.map(score)),
    },
    voices,
    themes,
    postsByDay: countByDay(posts.map((p) => p.created_at)),
    votesByDay: countByDay(votes.map((v) => v.created_at)),
    topCaptions,
    controversial,
    topVoters,
    funniest: funniest && funniest[1] > 0 ? { name: displayName(people.get(funniest[0])), score: funniest[1] } : null,
  };
}

export function voiceLabel(style: string | null) {
  return isStyleKey(style) ? STYLES[style].label : style ?? "—";
}
