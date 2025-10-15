-- Drop and recreate search_text function with correct column types
DROP FUNCTION IF EXISTS bible_schema.search_text(text, text, integer);

CREATE OR REPLACE FUNCTION bible_schema.search_text(
  p_query text,
  p_version_code text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  version_code character varying(10),
  book_name text,
  chapter_number integer,
  verse_number integer,
  verse_id uuid,
  text_content text,
  osis text
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'bible_schema', 'public'
AS $$
DECLARE
  v_version_id uuid;
BEGIN
  -- Resolve version
  SELECT id INTO v_version_id
  FROM bible_schema.bible_versions
  WHERE code = COALESCE(p_version_code, 'finstlk201');

  IF v_version_id IS NULL THEN
    RETURN;
  END IF;

  -- Use ILIKE for partial matching to find compound words
  RETURN QUERY
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
  WHERE v.version_id = v_version_id
    AND v.is_superseded = false
    AND v.text ILIKE '%' || p_query || '%'
  ORDER BY b.book_order, c.chapter_number, v.verse_number
  LIMIT p_limit;
END;
$$;