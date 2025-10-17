-- Extended text search using ILIKE for compound words
-- This allows finding partial matches like "yhdeksän" in "yhdeksänsataa"
CREATE OR REPLACE FUNCTION public.search_text_extended(
  p_query text,
  p_version_code text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  version_code text,
  book_name text,
  chapter_number integer,
  verse_number integer,
  verse_id uuid,
  text_content text,
  osis text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    bv.code AS version_code,
    b.name AS book_name,
    c.chapter_number,
    v.verse_number,
    v.id AS verse_id,
    v.text AS text_content,
    vk.osis
  FROM bible_schema.verses v
  JOIN bible_schema.chapters c ON c.id = v.chapter_id
  JOIN bible_schema.books b ON b.id = c.book_id
  JOIN bible_schema.bible_versions bv ON bv.id = v.version_id
  LEFT JOIN bible_schema.verse_keys vk ON vk.id = v.verse_key_id
  WHERE v.text ILIKE '%' || p_query || '%'
    AND bv.code = COALESCE(p_version_code, 'finstlk201')
    AND v.is_superseded = false
  ORDER BY b.book_order, c.chapter_number, v.verse_number
  LIMIT p_limit;
$$;