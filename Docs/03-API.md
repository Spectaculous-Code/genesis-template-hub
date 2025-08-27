# API Contracts — KR92 Bible Voice

## Overview
The app primarily uses the Supabase JS client against Postgres tables & SQL functions. For TTS we provide optional Edge Functions. DTOs are defined with Zod in the frontend.

## Tables (selected)

### verses
- **PK**: id (uuid or bigint)
- chapter_id → chapters.id
- number int
- text_plain text
- text_html text (optional)
- search_tsv tsvector (GIN index)

### bookmarks (RLS)
- id uuid, user_id uuid, verse_id, note text, created_at timestamptz

### highlights (RLS)
- id uuid, user_id uuid, verse_id, color text, created_at timestamptz

### audio_assets
- id uuid
- version_id, book_id, chapter_number, verse_number
- voice text
- url text (points to Supabase Storage)
- duration_ms int
- ready boolean

---

## SQL RPC (Postgres functions)

### `get_chapter(version_code text, book_code text, chapter int)`
**Returns**:  
type VerseDTO = { verse: number; text: string }
type ChapterDTO = {
  version: string; book: string; chapter: number; verses: VerseDTO[]
}

## Notes: Use chapter_verses_mv if available; else aggregate from base tables.

search_verses(q text, version_code text default 'KR92', limit int default 50)

Returns: array of {version, book, chapter, verse, snippet}
Behavior: web-search plainto_tsquery or websearch_to_tsquery; highlight with ts_headline.

toggle_bookmark(verse_id bigint, note text default null)

Security: checks auth.uid(); inserts if missing, removes if exists; returns new state.

upsert_highlight(verse_id bigint, color text)

Security: checks auth.uid(); upserts highlight.

## Edge Functions (optional)
POST /functions/v1/synthesize_tts

Input:
{
  "scope": "chapter",
  "version_code": "KR92",
  "book_code": "GEN",
  "chapter": 1,
  "voice": "fi_female_a"
}

Behavior:

Auth required.

Enqueue job → return job_id.

Job writes audio_assets rows and uploads files to storage://audio/*.

Emits realtime events on audio_jobs:<user_id>.

Output:
{ "job_id": "uuid", "status": "queued" }


GET /functions/v1/audio_sign_url?path=<storage-path>

Returns a short-lived signed URL for private assets.

## Realtime Channels

audio_jobs:<user_id> → { job_id, status, progress, error? }

(optional) presence:readers:<chapter_key> for lightweight “is anyone here” features.

## Client-side Contracts (TypeScript + Zod)

import { z } from "zod";

export const VerseDTO = z.object({
  verse: z.number().int().positive(),
  text: z.string()
});
export const ChapterDTO = z.object({
  version: z.string(),
  book: z.string(),
  chapter: z.number().int().positive(),
  verses: z.array(VerseDTO)
});
export type ChapterDTO = z.infer<typeof ChapterDTO>;

export const SearchHit = z.object({
  version: z.string(),
  book: z.string(),
  chapter: z.number(),
  verse: z.number(),
  snippet: z.string()
});

## Errors & Rate Limits

Return structured errors: { code, message }

429 throttle for search & TTS endpoints

Hide provider error detail; log internally

## Security

Never expose service keys in the client.

All user writes go through RLS or secured RPC.

Limit audio_assets public access; use signed URLs where required.


