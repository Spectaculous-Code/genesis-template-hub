-- 1) Materialized view for fast chapter reads
--    Includes: version + book + chapter + verse fields, OSIS (if verse_keys linked),
--    and handy audio URLs for chapter/verse.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.chapter_verses_mv AS
SELECT
  v.id                      AS verse_id,
  v.version_id,
  bv.code                   AS version_code,
  bv.language               AS version_language,

  b.id                      AS book_id,
  b.code                    AS book_code,         -- requires books.code (UNIQUE)
  b.name                    AS book_name,
  b.testament,
  b.book_order,

  c.id                      AS chapter_id,
  c.chapter_number,
  c.verses_count,
  c.audio_url               AS chapter_audio_url,

  v.verse_number,
  v.text,
  v.audio_url               AS verse_audio_url,

  vk.osis                   AS osis               -- NULL if verse_key_id not set
FROM public.verses v
JOIN public.chapters     c  ON c.id = v.chapter_id
JOIN public.books        b  ON b.id = c.book_id
JOIN public.bible_versions bv ON bv.id = v.version_id
LEFT JOIN public.verse_keys vk ON vk.id = v.verse_key_id
ORDER BY b.book_order, c.chapter_number, v.verse_number
WITH NO DATA;  -- populate explicitly after creating indexes

-- Required unique index for CONCURRENT refresh (stable key: verse_id)
CREATE UNIQUE INDEX IF NOT EXISTS chapter_verses_mv_uidx
  ON public.chapter_verses_mv (verse_id);

-- Hot navigation paths
CREATE INDEX IF NOT EXISTS chapter_verses_mv_nav_idx
  ON public.chapter_verses_mv (version_id, book_id, chapter_id, verse_number);

CREATE INDEX IF NOT EXISTS chapter_verses_mv_bookchap_idx
  ON public.chapter_verses_mv (version_id, book_id, chapter_number);

-- If you use OSIS for cross-version jumps
CREATE INDEX IF NOT EXISTS chapter_verses_mv_osis_idx
  ON public.chapter_verses_mv (version_id, osis);

-- First fill (must be without CONCURRENTLY right after creation)
REFRESH MATERIALIZED VIEW public.chapter_verses_mv;