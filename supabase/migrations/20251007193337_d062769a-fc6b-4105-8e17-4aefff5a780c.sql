-- Drop the old foreign key constraint that points to public.verses
ALTER TABLE public.highlights 
DROP CONSTRAINT IF EXISTS highlights_verse_id_fkey;

-- Add new foreign key constraint that points to bible_schema.verses
ALTER TABLE public.highlights 
ADD CONSTRAINT highlights_verse_id_fkey 
FOREIGN KEY (verse_id) 
REFERENCES bible_schema.verses(id) 
ON DELETE CASCADE;