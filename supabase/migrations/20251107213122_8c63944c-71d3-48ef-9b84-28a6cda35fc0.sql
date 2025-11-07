-- Remove orphaned rows from user_reading_history that reference non-existent books
DELETE FROM public.user_reading_history
WHERE NOT EXISTS (
  SELECT 1 FROM bible_schema.books b WHERE b.id = user_reading_history.book_id
);

-- Now fix the foreign key to reference bible_schema.books
ALTER TABLE public.user_reading_history
  DROP CONSTRAINT IF EXISTS user_reading_history_book_id_fkey;

ALTER TABLE public.user_reading_history
  ADD CONSTRAINT user_reading_history_book_id_fkey
  FOREIGN KEY (book_id) REFERENCES bible_schema.books(id) ON DELETE CASCADE;

-- Same fix for chapter_id
ALTER TABLE public.user_reading_history
  DROP CONSTRAINT IF EXISTS user_reading_history_chapter_id_fkey;

ALTER TABLE public.user_reading_history
  ADD CONSTRAINT user_reading_history_chapter_id_fkey
  FOREIGN KEY (chapter_id) REFERENCES bible_schema.chapters(id) ON DELETE CASCADE;

-- Same fix for version_id  
ALTER TABLE public.user_reading_history
  DROP CONSTRAINT IF EXISTS user_reading_history_version_id_fkey;

ALTER TABLE public.user_reading_history
  ADD CONSTRAINT user_reading_history_version_id_fkey
  FOREIGN KEY (version_id) REFERENCES bible_schema.bible_versions(id) ON DELETE CASCADE;

-- Same fix for verse_id
ALTER TABLE public.user_reading_history
  DROP CONSTRAINT IF EXISTS user_reading_history_verse_id_fkey;

ALTER TABLE public.user_reading_history
  ADD CONSTRAINT user_reading_history_verse_id_fkey
  FOREIGN KEY (verse_id) REFERENCES bible_schema.verses(id) ON DELETE CASCADE;