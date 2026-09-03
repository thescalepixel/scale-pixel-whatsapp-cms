<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: Scale Pixel WhatsApp CMS

Multi-tenant WhatsApp conversation management platform. Full architecture plan: see the
conversation history / `Context` section of the original build — summarized here for continuity.

- **Stack**: Next.js App Router + TypeScript + Tailwind, Supabase (Postgres/Auth/Realtime), deployed to Vercel eventually.
- **Supabase project**: `scale-pixel-whatsapp-cms`, ref `mjmcmmodgdtdejbigddg`, org "Scale Pixel". A separate, unrelated Supabase project (`hytpncujfstplllvdgwb`, single-org/team schema, no client tenancy) exists in the same org — do not confuse the two.
- **Tenant isolation**: enforced via Postgres RLS (see migrations 001–014 applied through the Supabase MCP `apply_migration`, not tracked as local files — pull the current schema with `list_tables`/`execute_sql` before assuming anything about it, or add a `supabase/migrations` folder if you want them version-controlled going forward). Every table's RLS policy is documented inline in the migration SQL.
- **Auth model**: no self-signup. Admin creates every account (Server Action `admin/users/actions.ts` `createUserAction`) via the Supabase Admin API, which requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (not committed, and not retrievable by an agent — grab it from Supabase Dashboard → Project Settings → API).
- **Bootstrap admin**: `admin@scalepixel.test` was seeded directly via SQL (no admin UI existed yet to create the first admin). Rotate its password via Forgot Password immediately in a real environment.
- **Test/seed data**: "Test Client Alpha" / "Test Client Beta" clients and `clienta@scalepixel.test` / `clientb@scalepixel.test` portal users were seeded directly via SQL to verify RLS isolation end-to-end. Delete these before real use.
- **Known follow-ups**: enable "Leaked password protection" in Supabase Auth settings (dashboard only, no MCP tool for it); Conversations/WhatsApp webhook/Realtime/Analytics/Notifications are unimplemented (Phase 2+, see nav items rendered as "Coming in a later phase").
- **Local dev**: Node.js is installed at `C:\Program Files\nodejs` but not on this machine's persistent PATH in shell tool sessions — prefix commands with `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH` (PowerShell) each time, or use the `dev` preview config in `.claude/launch.json` (already wraps this via `cmd.exe`).

