// Content settings for Caption the City: the daily theme and caption voices.

export const THEMES = [
  "Bodega cats",
  "Subway moments",
  "Views from Low Steps",
  "Overpriced coffee",
  "Dining hall mysteries",
  "Weekend in Brooklyn",
  "Pigeons with attitude",
  "Rats of New York",
  "Midwest vs. NYC",
  "Central Park chaos",
  "Butler Library at 2am",
  "Street food finds",
  "Dorm life",
  "Only in New York",
];

// One theme per day (New York time), so everyone posts around the same idea.
export function themeForToday(now = new Date()) {
  const nycDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
  const dayNumber = Math.floor(Date.parse(nycDate) / 86_400_000);
  return THEMES[dayNumber % THEMES.length];
}

export const STYLES = {
  columbia: {
    label: "Columbia insider",
    description: "Core Curriculum, Butler, John Jay references",
    voice:
      "a sleep-deprived Columbia University undergrad who references Butler Library, the Core Curriculum, Low Steps, John Jay dining hall, and the 1 train",
  },
  midwest: {
    label: "Midwest kid in NYC",
    description: "Wide-eyed and a little overwhelmed",
    voice:
      "a wide-eyed Midwesterner who just moved to New York City and keeps comparing everything to back home",
  },
  newyorker: {
    label: "Jaded New Yorker",
    description: "Seen it all, unimpressed",
    voice: "a jaded lifelong New Yorker who has seen it all and is unimpressed by everything",
  },
  online: {
    label: "Chronically online",
    description: "Lowercase, internet slang",
    voice: "a chronically online Gen Z college student who writes in lowercase with internet slang",
  },
  tabloid: {
    label: "Tabloid headline",
    description: "Dramatic New York Post energy",
    voice: "a dramatic New York tabloid writing an all-caps front-page headline",
  },
} as const;

export type StyleKey = keyof typeof STYLES;

export function isStyleKey(value: unknown): value is StyleKey {
  return typeof value === "string" && value in STYLES;
}

export function buildPrompt(style: StyleKey, theme: string) {
  return [
    'You write captions for "Caption the City", a site where Columbia University students share photos from around New York City and vote on the funniest captions.',
    `Write 3 different short, funny captions for this photo in the voice of ${STYLES[style].voice}.`,
    `Today's theme is "${theme}". Lean into it if it fits the photo, but always caption what is actually in the photo.`,
    "Rules: each caption is under 20 words. No hashtags. Keep it good-natured: never joke about people's appearance, race, gender, religion, or other personal traits.",
  ].join("\n");
}
