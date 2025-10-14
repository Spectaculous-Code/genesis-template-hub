-- Delete orphaned bookmarks before adding FKs
BEGIN;

-- Delete bookmarks whose chapter_id doesn't exist in bible_schema.chapters
DELETE FROM public.bookmarks b
WHERE NOT EXISTS (
  SELECT 1 FROM bible_schema.chapters c WHERE c.id = b.chapter_id
);

-- Delete bookmarks whose verse_id doesn't exist in bible_schema.verses  
DELETE FROM public.bookmarks b
WHERE NOT EXISTS (
  SELECT 1 FROM bible_schema.verses v WHERE v.id = b.verse_id
);

-- Drop old FK constraints
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_chapter_id_fkey;
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_verse_id_fkey;

-- Add FKs to bible_schema
ALTER TABLE public.bookmarks 
  ADD CONSTRAINT bookmarks_chapter_id_fkey 
  FOREIGN KEY (chapter_id) 
  REFERENCES bible_schema.chapters(id) 
  ON DELETE CASCADE;

ALTER TABLE public.bookmarks 
  ADD CONSTRAINT bookmarks_verse_id_fkey 
  FOREIGN KEY (verse_id) 
  REFERENCES bible_schema.verses(id) 
  ON DELETE CASCADE;

-- Utility function to read user bookmarks via bible_schema joins
CREATE OR REPLACE FUNCTION public.get_user_bookmarks(
  p_user_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  verse_id uuid,
  verse_number integer,
  verse_text text,
  chapter_number integer,
  book_name text,
  version_code text,
  version_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public','bible_schema'
AS $$
  SELECT 
    b.id,
    b.created_at,
    v.id as verse_id,
    v.verse_number,
    v.text as verse_text,
    c.chapter_number,
    bk.name as book_name,
    bv.code as version_code,
    bv.name as version_name
  FROM public.bookmarks b
  JOIN bible_schema.verses v   ON v.id = b.verse_id
  JOIN bible_schema.chapters c ON c.id = v.chapter_id
  JOIN bible_schema.books bk   ON bk.id = c.book_id
  JOIN bible_schema.bible_versions bv ON bv.id = v.version_id
  WHERE b.user_id = p_user_id
  ORDER BY b.created_at DESC
  LIMIT p_limit;
$$;

COMMIT;