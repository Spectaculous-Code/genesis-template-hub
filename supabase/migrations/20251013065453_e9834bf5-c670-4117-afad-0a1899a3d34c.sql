-- Fix save_bookmark to always map to PUBLIC verse/chapter via OSIS and avoid bible_schema fallbacks that break FKs
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
AS $function$
DECLARE
  v_version_id uuid;
  v_book_id uuid;
  v_chapter_id uuid;
  v_first_verse_id uuid;
  v_osis text;
  v_public_verse_id uuid;
  v_public_chapter_id uuid;
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

  -- Derive OSIS using bible_schema.verse_keys
  SELECT vk.osis INTO v_osis
  FROM bible_schema.verses v
  LEFT JOIN bible_schema.verse_keys vk ON vk.id = v.verse_key_id
  WHERE v.id = v_first_verse_id;

  -- Map OSIS to PUBLIC verse id for the given version
  SELECT verse_id INTO v_public_verse_id
  FROM public.map_osis_to_verse_ids(p_version_code, ARRAY[v_osis])
  LIMIT 1;

  IF v_public_verse_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verse mapping not found in public for this version');
  END IF;

  -- Get PUBLIC chapter id from the mapped verse
  SELECT chapter_id INTO v_public_chapter_id
  FROM public.verses
  WHERE id = v_public_verse_id;

  IF v_public_chapter_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chapter mapping not found in public for this version');
  END IF;

  -- Check for existing bookmark for the PUBLIC chapter
  SELECT id INTO v_bookmark_id
  FROM public.bookmarks
  WHERE user_id = p_user_id AND chapter_id = v_public_chapter_id;
  
  IF v_bookmark_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bookmark already exists', 'bookmark_id', v_bookmark_id);
  END IF;

  -- Insert bookmark using PUBLIC IDs
  INSERT INTO public.bookmarks (user_id, chapter_id, verse_id, osis)
  VALUES (p_user_id, v_public_chapter_id, v_public_verse_id, v_osis)
  RETURNING id INTO v_bookmark_id;
  
  RETURN jsonb_build_object('success', true, 'bookmark_id', v_bookmark_id);
END;
$function$;