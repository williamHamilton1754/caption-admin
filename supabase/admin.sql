-- Week 6: superadmin access for the admin panel.
-- Run this in the Supabase dashboard: SQL Editor → New query → Run.
-- Admin access is enforced by the database (RLS), not just by the app.

-- 1. The flag. Everyone starts as a regular user.
alter table public.profiles add column if not exists is_superadmin boolean not null default false;

-- Users may only edit their own name and photo, never is_superadmin.
-- (RLS picks *which rows*; column privileges pick *which columns*.)
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name, avatar_url, updated_at) on public.profiles to authenticated;

-- 2. "Is the signed-in user a superadmin?" Runs as the table owner so it can
--    read profiles without tripping over profiles' own RLS rules.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_superadmin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke execute on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

-- 3. What superadmins can do, on top of the normal user rules.

-- READ users/profiles
drop policy if exists "Superadmins can read all profiles" on public.profiles;
create policy "Superadmins can read all profiles"
  on public.profiles for select to authenticated
  using (public.is_superadmin());

-- READ upvotes/downvotes
drop policy if exists "Superadmins can read all votes" on public.caption_votes;
create policy "Superadmins can read all votes"
  on public.caption_votes for select to authenticated
  using (public.is_superadmin());

-- CREATE AI captions on any post (still starting at 0 votes)
drop policy if exists "Superadmins can add AI captions" on public.captions;
create policy "Superadmins can add AI captions"
  on public.captions for insert to authenticated
  with check (
    public.is_superadmin()
    and source = 'ai'
    and created_by = auth.uid()
    and upvotes = 0 and downvotes = 0
  );

-- UPDATE caption text only (vote totals stay owned by the vote trigger)
revoke update on public.captions from anon, authenticated;
grant update (content) on public.captions to authenticated;

drop policy if exists "Superadmins can edit captions" on public.captions;
create policy "Superadmins can edit captions"
  on public.captions for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- DELETE captions and whole posts (deleting a post deletes its captions and votes)
drop policy if exists "Superadmins can delete captions" on public.captions;
create policy "Superadmins can delete captions"
  on public.captions for delete to authenticated
  using (public.is_superadmin());

drop policy if exists "Superadmins can delete posts" on public.posts;
create policy "Superadmins can delete posts"
  on public.posts for delete to authenticated
  using (public.is_superadmin());

-- Read photos (to send to the AI) and delete them along with their post
drop policy if exists "Superadmins can read photos" on storage.objects;
create policy "Superadmins can read photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_superadmin());

drop policy if exists "Superadmins can delete photos" on storage.objects;
create policy "Superadmins can delete photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_superadmin());

-- 4. Make yourself a superadmin. This is how you avoid being locked out:
--    the SQL Editor runs as the database owner, which bypasses RLS.
--    Replace the email with the Google account you'll sign in with.
-- update public.profiles set is_superadmin = true where email = 'you@example.com';
