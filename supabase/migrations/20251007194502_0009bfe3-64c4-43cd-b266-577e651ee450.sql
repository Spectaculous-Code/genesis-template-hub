-- Create a function to get user highlights with verse details from bible_schema
CREATE OR REPLACE FUNCTION public.get_user_highlights(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  color varchar,
  created_at timestamptz,
  verse_id uuid,
  verse_number int,
  verse_text text,
  chapter_number int,
  book_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, bible_schema
AS $$
  SELECT 
    h.id,
    h.color,
    h.created_at,
    v.id as verse_id,
    v.verse_number,
    v.text as verse_text,
    c.chapter_number,
    b.name as book_name
  FROM public.highlights h
  JOIN bible_schema.verses v ON v.id = h.verse_id
  JOIN bible_schema.chapters c ON c.id = v.chapter_id
  JOIN bible_schema.books b ON b.id = c.book_id
  WHERE h.user_id = p_user_id
    AND v.is_superseded = false
  ORDER BY h.created_at DESC;
$$;