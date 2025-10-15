-- Improved search_text function with hybrid search strategy
-- 1. Fast tsvector search for exact word matches
-- 2. Fallback to trigram ILIKE for substring/compound word matches

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
  v_tsquery tsquery;
  v_result_count integer;
BEGIN
  -- Resolve version
  SELECT id INTO v_version_id
  FROM bible_schema.bible_versions
  WHERE code = COALESCE(p_version_code, 'finstlk201');

  IF v_version_id IS NULL THEN
    RETURN;
  END IF;

  -- Create tsquery from plain text (handles Finnish stemming)
  v_tsquery := plainto_tsquery('finnish', p_query);

  -- Strategy 1: Try fast tsvector search first (uses GIN index on text_search)
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
    AND v.text_search @@ v_tsquery
  ORDER BY b.book_order, c.chapter_number, v.verse_number
  LIMIT p_limit;

  -- Check if we got results
  GET DIAGNOSTICS v_result_count = ROW_COUNT;

  -- Strategy 2: If no results from tsvector, use trigram ILIKE fallback
  -- This handles substring matches like "yhdeksän" in "yhdeksänsataa"
  IF v_result_count = 0 THEN
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
  END IF;
END;
$$;