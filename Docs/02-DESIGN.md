# Design / Architecture — KR92 Bible Voice

## Purpose
A fast, privacy-respecting reader for the Finnish KR92 Bible with optional “voice mode” (pre-rendered audio or on-the-fly TTS). Built with Vite + React + TypeScript + shadcn + Tailwind. Supabase provides Postgres (+RLS), optional RPC/Edge Functions, Storage, and Realtime.

> Repo facts used here: the project uses Vite/TS/React/shadcn/Tailwind and has `src/`, `public/`, `supabase/` folders. (See README and tree.)
– Reference: `README.md` and repo file list.
 
## High-Level Architecture
- **Frontend (Vite + React)**  
  - UI kit: shadcn (components under `src/components/ui/*`)
  - Pages & features in `src/features/*` and `src/pages/*` (React Router)
  - Data layer: Supabase JS client + React Query
  - Validation: Zod DTOs
  - Audio: HTML5 `<audio>` + preload queue (verses)
- **Backend (Supabase)**
  - **DB**: canonical KR92 text tables; user tables (bookmarks/highlights/progress); optional `audio_assets`.
  - **Storage**: bucket `audio/` for pre-rendered clips.
  - **RPC/Edge Functions (optional)**:
    - `search_verses(query text)` (SQL func)
    - `get_chapter(book_code text, chapter int)` (SQL func or view)
    - `synthesize_tts(payload)` (Edge Function to request/generate TTS, enqueue, and write `audio_assets`)
  - **Realtime**: channel `audio_jobs:<user_id>` for TTS job status.

## Proposed Directory Layout (frontend)

src/
├─ app/                           # App bootstrap (providers, root layout)
│  └─ providers.tsx
├─ pages/                         # Route files (React Router)
│  ├─ index.tsx
│  └─ read/[book]/[chapter].tsx
├─ components/                    # Shared UI components
│  └─ ui/                         # shadcn/ui primitives & variants
├─ features/                      # Domain features
│  ├─ bible/                      # Navigation, chapter/verse reader
│  ├─ audio/                      # Player, queue, preloading
│  ├─ search/                     # Search view & history
│  └─ user/                       # Auth/profile
├─ lib/                           # App libs & adapters
│  ├─ supabase.ts                 # Supabase client (singleton)
│  ├─ audio.ts                    # Audio helpers (queue, preload, signed URLs)
│  └─ zod/                        # DTO schemas & validators
│     └─ index.ts
└─ styles/                        # Global styles
   └─ globals.css                 # Tailwind globals
   
| Path                  | Purpose (1-liner)                                  |
| --------------------- | -------------------------------------------------- |
| `src/app/`            | App bootstrap: context providers, root layout.     |
| `src/pages/`          | Route components for React Router.                 |
| `src/components/ui/`  | shadcn/ui primitives and style-guided wrappers.    |
| `src/features/*`      | Vertical slices by domain (bible, audio, search…). |
| `src/lib/supabase.ts` | Configured Supabase client (import from here).     |
| `src/lib/audio.ts`    | Audio utilities: queue, preloading, signed URLs.   |
| `src/lib/zod/`        | Zod schemas for DTOs & API contracts.              |
| `src/styles/`         | Tailwind globals and tokens.                       |



## Data Model (DB)
> Adjust names if your `supabase/` SQL already defines different tables.

**Core text (read-only, public):**
- `bible_versions(id, code, name, language)`  
- `books(id, version_id, order_index, code, name_fi)`
- `chapters(id, book_id, number)`
- `verses(id, chapter_id, number, text_plain, text_html, search_tsv tsvector)`

**User data (RLS-protected):**
- `bookmarks(id, user_id, verse_id, note, created_at)`
- `highlights(id, user_id, verse_id, color, created_at)`
- `reading_progress(id, user_id, last_book_id, last_chapter_id, last_verse_id, updated_at)`

**Audio:**
- `audio_assets(id, version_id, book_id, chapter_number, verse_number, voice, url, duration_ms, ready boolean, created_at)`
- `audio_jobs(id, user_id, scope enum('chapter','selection'), params jsonb, status enum('queued','running','done','error'), error text, created_at)`

### Views & Performance
- `chapter_verses_mv(version_code, book_code, chapter_number, verses jsonb)`  
  Materialized view to load a whole chapter in one fetch for instant UI. Refresh by version/book/chapter after imports.

## RLS & Security Principles
- Public read on **text** tables; **no** write.
- User tables: `policy using (user_id = auth.uid()) with check (user_id = auth.uid())`.
- `audio_assets` public read **only if** `ready = true` and asset belongs to a public bible version; otherwise signed URLs.
- All mutations go through RPC/Edge Functions that re-check auth + inputs.

## Audio Pipeline Options
1) **Pre-rendered** clips (best UX): A one-time batch creates `audio_assets` and stores files in `storage://audio/…`.
2) **On-demand TTS**: Edge Function enqueues synthesis; UI subscribes to `audio_jobs` realtime; player swaps to ready clips as they arrive.

## Client Data Flow — Typical Chapter Read
1. Router loads `/read/:book/:chapter`.
2. Fetch chapter via `chapter_verses_mv` (or `get_chapter()` RPC) → push into React Query cache.
3. Build audio queue for verses; prefetch next 2–4 clips (signed URLs if private).
4. Render verses; lazy-mount `<audio>`; update progress on verse end.
5. Bookmarks/highlights mutations go via Supabase client (RLS).

## Accessibility (A11y)
- Keyboard shortcuts (↑/↓ verse, Space play/pause).
- Live region for playback status.
- Font size & contrast controls.

## Observability
- Add `security_events` table for auth/mutation audit.
- Client logs: basic error breadcrumbs (no PII).
