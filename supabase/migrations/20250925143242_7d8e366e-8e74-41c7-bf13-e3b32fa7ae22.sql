-- Add osis and chapter_id to bookmarks, and allow verse_id to be nullable
ALTER TABLE public.bookmarks
  ADD COLUMN IF NOT EXISTS osis text,
  ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES public.chapters(id);

-- Allow saving bookmarks at chapter level by making verse_id nullable
ALTER TABLE public.bookmarks
  ALTER COLUMN verse_id DROP NOT NULL;

-- Optional helpful indexes for lookups (safe if run multiple times)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_bookmarks_user_chapter'
  ) THEN
    CREATE INDEX idx_bookmarks_user_chapter ON public.bookmarks (user_id, chapter_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_bookmarks_user_verse'
  ) THEN
    CREATE INDEX idx_bookmarks_user_verse ON public.bookmarks (user_id, verse_id);
  END IF;
END $$;