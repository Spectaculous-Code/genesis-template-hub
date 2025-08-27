# `Docs/04-DEV-WORKFLOW.md`

# Dev Workflow — Humans + Windsurf
This file tells teammates and Windsurf how to work in this repo.

## 0) Prereqs
- Node 18+ (bun ok), Vite toolchain
- Supabase project + anon/public env vars
- `.env.local`:
  - VITE_SUPABASE_URL=
  - VITE_SUPABASE_ANON_KEY=

## 1) Daily Commands
- **Start app**: `npm run dev` (Vite)
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Lint/Typecheck**: `npm run lint` / `tsc -p .`
> Use the exact scripts from `package.json`.

## 2) Branching & PRs
- Feature branches: `ai/<feature>` or `feat/<feature>`
- Small, atomic PRs (≤ ~300 lines)
- Link to updated docs when behavior changes

## 3) Windsurf Usage
- In chat:
Load context: @/Docs/02-DESIGN.md @/Docs/03-API.md @/Docs/04-DEV-WORKFLOW.md
Goal: Implement <feature>.
Rules: Plan → Patch → Stop. Show diffs only; ask before delete/rename; update tests; suggest a small commit message.

- Keep changes minimal and reversible.
- Use React Query and Zod as specified.

## 4) Coding Standards
- TypeScript strict; no `any` unless justified.
- Tailwind + shadcn patterns; keep UI accessible (WCAG AA).
- DTOs validated with Zod at boundaries.
- Avoid over-fetching; cache per route with React Query.

## 5) Data Access
- Read bible text via `get_chapter()` or `chapter_verses_mv`.
- Writes (`bookmarks`, `highlights`, `progress`) must respect RLS.
- No direct writes to text tables.

## 6) Audio
- Prefer existing `audio_assets`; preload the next 2–4 clips.
- If clip missing and TTS is enabled: call `synthesize_tts` and subscribe to realtime updates.
- Use signed URLs for private assets.

## 7) Testing (incremental adoption)
- Unit: Vitest (set up if missing: `vitest`, `@testing-library/react`)
- E2E: Playwright basic flows (home → read → play audio → bookmark)
- Add test when fixing a bug.

## 8) Security & Secrets
- Never commit keys or provider creds.
- Validate user inputs in RPC/Edge Functions.
- Add minimal audit logging to `security_events`.

## 9) DB & Migrations
- Place SQL in `supabase/` (migrations or seed scripts).
- If you add `chapter_verses_mv`, include a refresh script (per version/book/chapter).
- Keep indices for `search_tsv` and `audio_assets(ready,book_id,chapter_number)`.

## 10) Definition of Done
- Feature implemented with types & tests
- Lints/types pass; no dead code
- Docs updated (this file, DESIGN, or API as needed)
- PR approved and merged
