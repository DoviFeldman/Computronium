---
name: verify
description: Run Computronium locally against a stub Supabase and drive it in a browser to verify changes end-to-end.
---

# Verifying Computronium changes

There's no real Supabase in dev/CI environments, but the whole app talks to it
through supabase-js. `stub-supabase.mjs` (next to this file) is a ~200-line
in-memory PostgREST + Storage stub that's "enough" for every query the app
makes. Recipe that works:

```bash
node .claude/skills/verify/stub-supabase.mjs &        # port 54321, logs every request
printf 'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nNEXT_PUBLIC_SUPABASE_ANON_KEY=stub\nSUPABASE_SERVICE_ROLE_KEY=stub\n' > .env.local
npx next build && npx next start -p 3100 &            # .env.local is read at runtime
```

Then drive pages with Playwright (chromium at `/opt/pw-browsers/chromium` in
remote sessions) or curl the `/api/*` routes directly. The stub seeds one
normal post and one attempted post so the feeds aren't empty. Inspect what the
app actually wrote with e.g.
`curl 'http://127.0.0.1:54321/rest/v1/posts?select=*'`.

Gotchas learned the hard way:

- Anonymous flows need no auth stubbing — `getUser()` without a session never
  hits the network. Signed-in flows are NOT covered by the stub.
- The stub doesn't apply column defaults (e.g. `current_version`), so pages
  may show small gaps a real Postgres wouldn't — not app bugs.
- In Playwright, wait for real content (`.card`, `h1:has-text(...)`), not
  `.center.muted` — that class also matches the "Loading…" placeholder.
- Playwright `text=` selectors are case-insensitive substring matches; after
  form submits, wait for the URL (`waitForURL`) before asserting page text.
- The post form's Post button is gated on BotCheck, which auto-passes on
  mount — no interaction needed.
- Remember to delete `.env.local` and kill both servers when done.
