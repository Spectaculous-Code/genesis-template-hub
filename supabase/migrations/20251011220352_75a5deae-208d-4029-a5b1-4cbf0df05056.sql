-- Fix save_bookmark to avoid selecting non-existent column osis from verses
-- Derive OSIS via verse_keys join instead.

CREATE OR REPLACE FUNCTION public.save_bookmark(
  p_user_id uuid,
  p_book_name text,
  p_chapter_number integer,
  p_version_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'bible_schema'
AS $$
DECLARE
  v_version_id uuid;
  v_book_id uuid;
  v_chapter_id uuid;
  v_public_chapter_id uuid;
  v_first_verse_id uuid;
  v_public_verse_id uuid;
  v_osis text;
  v_bookmark_id uuid;
BEGIN
  -- Resolve version in bible_schema
  SELECT id INTO v_version_id
  FROM bible_schema.bible_versions
  WHERE code = p_version_code;
  
  IF v_version_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Version not found');
  END IF;

  -- Resolve book in bible_schema
  SELECT id INTO v_book_id
  FROM bible_schema.books
  WHERE name = p_book_name AND version_id = v_version_id;
  
  IF v_book_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Book not found');
  END IF;

  -- Resolve chapter in bible_schema
  SELECT id INTO v_chapter_id
  FROM bible_schema.chapters
  WHERE book_id = v_book_id AND chapter_number = p_chapter_number;
  
  IF v_chapter_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chapter not found');
  END IF;

  -- First verse of the chapter in bible_schema
  SELECT id INTO v_first_verse_id
  FROM bible_schema.verses
  WHERE chapter_id = v_chapter_id AND verse_number = 1
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_first_verse_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verse not found');
  END IF;

  -- Map to public chapter
  SELECT c.id INTO v_public_chapter_id
  FROM public.chapters c
  JOIN public.books b ON b.id = c.book_id
  JOIN public.bible_versions bv ON bv.id = b.version_id
  WHERE bv.code = p_version_code
    AND b.name = p_book_name
    AND c.chapter_number = p_chapter_number;

  -- Map to first public verse in that chapter
  SELECT v.id INTO v_public_verse_id
  FROM public.verses v
  WHERE v.chapter_id = v_public_chapter_id
    AND v.verse_number = 1
  LIMIT 1;

  -- Fallbacks if public mappings are missing
  IF v_public_chapter_id IS NULL THEN
    v_public_chapter_id := v_chapter_id;  -- use bible_schema id as fallback
  END IF;

  IF v_public_verse_id IS NULL THEN
    v_public_verse_id := v_first_verse_id; -- use bible_schema id as fallback
  END IF;

  -- Derive OSIS using public.verse_keys when available
  IF v_public_verse_id IS NOT NULL THEN
    SELECT vk.osis INTO v_osis
    FROM public.verses v
    LEFT JOIN public.verse_keys vk ON vk.id = v.verse_key_id
    WHERE v.id = v_public_verse_id;
  END IF;

  -- Fallback: try bible_schema.verse_keys
  IF v_osis IS NULL THEN
    SELECT vk.osis INTO v_osis
    FROM bible_schema.verses v
    LEFT JOIN bible_schema.verse_keys vk ON vk.id = v.verse_key_id
    WHERE v.id = v_first_verse_id;
  END IF;

  -- If still null, allow insert without OSIS
  -- Check for existing bookmark for the chapter
  SELECT id INTO v_bookmark_id
  FROM public.bookmarks
  WHERE user_id = p_user_id AND chapter_id = v_public_chapter_id;
  
  IF v_bookmark_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bookmark already exists', 'bookmark_id', v_bookmark_id);
  END IF;

  -- Insert bookmark
  INSERT INTO public.bookmarks (user_id, chapter_id, verse_id, osis)
  VALUES (p_user_id, v_public_chapter_id, v_public_verse_id, v_osis)
  RETURNING id INTO v_bookmark_id;
  
  RETURN jsonb_build_object('success', true, 'bookmark_id', v_bookmark_id);
END;
$$;