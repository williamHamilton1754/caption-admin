# Caption the City · Admin

Superadmin area for [Caption the City](https://homework-11-rose.vercel.app). It uses the same Supabase database as the main app.

- **Dashboard:** Humans vs AI, funniest AI voice, daily activity, top and most controversial captions
- **Users:** read every profile, with each person's photos, captions and votes
- **AI media:** generate new AI captions with Claude, read, edit and delete captions, delete posts
- **Votes:** read every upvote and downvote

## Security

Every route is behind Google sign-in (`src/proxy.ts`), and every page and action also requires `profiles.is_superadmin = true` (`src/lib/admin.ts`).

The database enforces the same rule, so the app is not the only lock. `supabase/admin.sql` adds Row Level Security policies that let a user read other people's profiles and votes, or edit and delete captions, only when `public.is_superadmin()` is true. Users can't grant themselves the flag, because the `authenticated` role may update only `first_name`, `last_name`, `avatar_url` and `updated_at` on `profiles`.

## "Won't I lock myself out?"

No. The flag is set from the Supabase **SQL Editor**, which connects as the database owner and isn't subject to RLS:

```sql
update public.profiles set is_superadmin = true where email = 'you@example.com';
```

Sign in to the main app once first, so your profile row exists.

## Environment variables

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | same as the main app |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as the main app |
| `ANTHROPIC_API_KEY` | for generating AI captions (Secret) |
