-- Add chapter-level audio support
ALTER TABLE public.chapters ADD COLUMN audio_url text;

-- Add full-text search support to verses
ALTER TABLE public.verses ADD COLUMN text_search tsvector GENERATED ALWAYS AS (to_tsvector('finnish', text)) STORED;

-- Add history type to reading history
ALTER TABLE public.user_reading_history ADD COLUMN history_type character varying NOT NULL DEFAULT 'read' CHECK (history_type = ANY (ARRAY['read'::character varying, 'listen'::character varying]::text[]));

-- Make verse_number non-nullable with default in reading history
ALTER TABLE public.user_reading_history ALTER COLUMN verse_number SET DEFAULT 1;
UPDATE public.user_reading_history SET verse_number = 1 WHERE verse_number IS NULL;
ALTER TABLE public.user_reading_history ALTER COLUMN verse_number SET NOT NULL;

-- Create dedicated bookmarks table
CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  verse_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_verse_id_fkey FOREIGN KEY (verse_id) REFERENCES public.verses(id) ON DELETE CASCADE,
  CONSTRAINT bookmarks_unique_user_verse UNIQUE(user_id, verse_id)
);

-- Create dedicated highlights table  
CREATE TABLE public.highlights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  verse_id uuid NOT NULL,
  color character varying NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$') DEFAULT '#FFFF00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT highlights_verse_id_fkey FOREIGN KEY (verse_id) REFERENCES public.verses(id) ON DELETE CASCADE,
  CONSTRAINT highlights_unique_user_verse UNIQUE(user_id, verse_id)
);

-- Create performance indexes
CREATE INDEX idx_verses_chapter_id ON public.verses(chapter_id);
CREATE INDEX idx_verses_version_id ON public.verses(version_id);
CREATE INDEX idx_verses_text_search ON public.verses USING gin(text_search);
CREATE INDEX idx_user_reading_history_user_id ON public.user_reading_history(user_id);
CREATE INDEX idx_user_reading_history_book_id ON public.user_reading_history(book_id);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_highlights_user_id ON public.highlights(user_id);

-- Enable RLS on new tables
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookmarks
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for highlights
CREATE POLICY "Users can view their own highlights" ON public.highlights
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own highlights" ON public.highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own highlights" ON public.highlights
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own highlights" ON public.highlights
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create trigger for highlights updated_at
CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON public.highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add color constraint to existing user_markings for backwards compatibility
ALTER TABLE public.user_markings ADD CONSTRAINT valid_color CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');