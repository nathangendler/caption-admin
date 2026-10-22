# Caption admin

Admin area for [Caption This](https://github.com/nathangendler/hello-world-nextjs). Same
Supabase project, separate Next.js app and Vercel deployment.

## What it does

- **Overview:** totals, finish rate of the caption ladder, median seconds per pick, which
  ladder slot tends to win, winning vs losing caption length, emoji share, posts per day,
  most liked moments, most active users, and model usage.
- **Users:** read every profile with activity counts and a per-user page.
- **Moments (AI media):** list posted and unfinished moments; open one to edit any caption,
  add a caption, delete a caption, choose the posted winner, edit the user's note, see the
  exact prompt sent to the model, the ladder picks, and who liked it; delete the moment with
  its photo.
- **Votes:** read the latest ladder picks and likes.

## Access control

Every route except `/login`, `/denied`, and the auth callbacks requires a Google sign-in
**and** `profiles.is_superadmin = true`. It is enforced three times:

1. `proxy.ts` redirects anonymous visitors to `/login` and signed-in non-admins to `/denied`.
2. Every page and server action calls `requireSuperadmin()` again.
3. Row-level security in Postgres only grants cross-user reads and media writes to a session
   whose profile is flagged (`public.is_superadmin()`), so even a bug in this app cannot leak
   or change data for a non-admin.

Users cannot set the flag on themselves: the `authenticated` role has column-level update
rights on `profiles` for name, bio, and avatar only.

## "Won't you be locked out?"

Yes, by design: no API path can set `is_superadmin`. The first admin is created with direct
database access, which the project owner already has: the Supabase SQL editor, the Supabase
CLI, or the management API (`scripts/sql.sh` in the main repo wraps it). The flag was set with:

```sql
update public.profiles set is_superadmin = true where email = 'owner@example.com';
```

## Setup

Copy `.env.example` to `.env.local` with the same Supabase URL and anon key as the main app.
The schema lives in the main repo (`supabase-admin.sql`).

```bash
npm run dev
npm test
npm run typecheck
npm run lint
```
