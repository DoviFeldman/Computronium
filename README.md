# 🤖 Computronium

A robotics project-sharing website — **GitHub + MakerWorld, but for hobbyist robots**.
Professionals post well-documented robot projects; beginners and kids browse,
order the parts, 3D-print the files, flash the code, and build them like Lego.

Built with **Next.js (App Router)** + **Supabase** (free tier), deploys on the
**Vercel free tier**. No paid services, no required API keys.

---

## The pages

| Page | URL | What it is |
|---|---|---|
| Main feed | `/` | Endless-scroll project grid, hot-ranked, search + filters |
| Learn | `/learn` | Honest hardware explainers (all from `config/explainers.ts`) |
| Advanced | `/advanced` | Showcase of 🔴-difficulty / advanced-flagged builds |
| Personal page | `/u/username` | A user's profile + posts. **The only place with a New Post button** |
| Liberated Hardware | `/liberated` | Open-source replacements for subscription products (owner-curated) |
| Post form | `/post` | The one-page create/edit form (everything optional) |
| Post view | `/p/<id>` | A project: images, video, 3D viewer, code, parts list, fork button |
| History | `/p/<id>/history` | Every saved version of a post (GitHub-style, full snapshots) |
| Login | `/login` | Username + password — no email needed |
| Settings | `/settings` | Bio, optional recovery email, sign out |
| Admin | `/admin` | Owner-only: delete, pin, assign to Liberated categories |

---

## 1. Local setup

```bash
git clone <this repo>
cd Computronium
npm install
cp .env.example .env.local     # then fill it in (next section)
npm run dev                    # → http://localhost:3000
```

The site runs even with empty env vars (pages render, data is just empty),
so you can poke at the UI before setting up Supabase.

## 2. Supabase setup (one time, ~10 minutes, free)

1. Create a free account + project at <https://supabase.com>.
2. **Run the schema:** open your project → *SQL Editor* → *New query* →
   paste ALL of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates the tables, the public storage bucket, and the security
   policies. (Safe to re-run any time.)
3. **Turn off email confirmation:** *Authentication → Sign In / Up → Email* →
   disable **"Confirm email"**. Accounts here are username-only — the
   synthesized emails can't receive mail, so confirmation must be off.
4. **Copy your keys:** *Settings → API* →
   - `Project URL`      → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key  → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(secret! server-only)*

   Put them in `.env.local` (and later in Vercel).
5. **Make yourself admin:** sign up on the site with your username, then set
   `ADMIN_USERNAME=<that username>` in the env vars. (Alternative: flip
   `is_admin` to true on your row in the `profiles` table.)

## 3. Deploying to Vercel (free)

1. Push this repo to GitHub.
2. Go to <https://vercel.com> → *Add New → Project* → import the repo.
   Vercel auto-detects Next.js; no build settings needed.
3. In *Project → Settings → Environment Variables*, add the same four
   variables from `.env.example`.
4. Deploy. Done — every `git push` redeploys automatically.

---

## 4. Editing the site (the config folder)

Everything the owner is meant to touch lives in [`/config`](config). Each file
starts with a comment block explaining exactly what it controls:

| File | Controls |
|---|---|
| `config/site.ts` | Site name, tagline, **feed ranking weights**, cost brackets, the Liberated page title |
| `config/hardware.ts` | The master hardware list (checkboxes, chips, filters, buy links, rough prices) |
| `config/codePatterns.ts` | The parts-detection bot: code text → hardware ids |
| `config/promptedQuestions.ts` | The guided questions on the post form |
| `config/categories.ts` | The Liberated page categories |
| `config/explainers.ts` | Every article on `/learn` |
| `config/featuredBoards.ts` | The big board-filter buttons on the main page |

Change a file, commit, push — Vercel redeploys with the new content.

## 5. How things work (for future-you)

- **Hot ranking** — `score = (upvotes·W + views·V + 1) / (hours + offset)^gravity`,
  Hacker-News style. Tune the weights in `config/site.ts`; math in `lib/ranking.ts`.
- **Versioning** — every save writes a FULL snapshot row to `post_versions`
  (no diffs, never deleted). `/p/<id>/history` renders them.
- **Forking** — copies the latest version into a new post with `fork_of` set;
  the fork has its own history; the original just gets `fork_count + 1`.
  Uploaded files are shared by URL, not duplicated in storage.
- **Anonymous posts** — no account needed. The poster gets a one-time edit
  password (stored as a SHA-256 hash on the post row). Losing it means the
  post can only be edited/deleted by the admin.
- **Accounts** — username + password only. Supabase Auth wants an email, so
  we synthesize `username@computronium.local` internally (see `lib/auth.ts`).
- **Password recovery** — there is none built in (no email infrastructure!).
  If a user with a recovery email on file loses their password, you (admin)
  can verify them by mail and set a new password by hand in the Supabase
  dashboard: *Authentication → Users → … → Reset password*.
- **Writes go through API routes** — the browser never writes to the DB
  directly. Permission checks are plain TypeScript in `app/api/*`; the
  service-role key does the writing. RLS allows public reads only.
- **The detection bot is not AI** — it's substring matching against
  `config/codePatterns.ts`, running in the browser. Zip uploads are scanned
  with jszip.

## 6. Storage: swapping Supabase → Cloudflare R2 later

All file traffic goes through **one file**: [`lib/storage.ts`](lib/storage.ts)
(`uploadFile` / `getFileUrl` / `deleteFile`). To move to R2, rewrite those
three function bodies (step-by-step instructions are in the file's comments)
— nothing else in the app changes. Old files keep working because every file's
full URL is stored in the database.

Upload limits: 4MB per file (Vercel free-tier request cap). Bigger STLs/zips
should be pasted as external links — the post form has a field for that, and
GitHub links get converted to raw URLs automatically for the 3D viewer.

## 7. Turning on AI later (optional, one file)

The "✨ Suggest instructions" button on the post form is wired but disabled.
To enable it: get an API key, set `AI_API_KEY` in the env vars, and fill in
the two function bodies in [`lib/ai.ts`](lib/ai.ts) — the file contains exact
step-by-step instructions and example code. The button un-disables itself
automatically once the key exists.

## 8. The bot check placeholder

`components/BotCheck.tsx` renders above the Post button and currently
**always passes**. The file documents two upgrade paths (Cloudflare
Turnstile, or a homemade drag-the-circle puzzle) for when spam becomes real.

---

*`Ideas.txt` is the owner's scratchpad and is intentionally left untouched.*
