-- Drop existing foreign key constraints that point to public schema
ALTER TABLE public.audio_cues DROP CONSTRAINT IF EXISTS audio_cues_verse_id_fkey;
ALTER TABLE public.audio_assets DROP CONSTRAINT IF EXISTS audio_assets_chapter_id_fkey;
ALTER TABLE public.audio_assets DROP CONSTRAINT IF EXISTS audio_assets_version_id_fkey;

-- Add new foreign key constraints pointing to bible_schema
ALTER TABLE public.audio_cues 
  ADD CONSTRAINT audio_cues_verse_id_fkey 
  FOREIGN KEY (verse_id) 
  REFERENCES bible_schema.verses(id) 
  ON DELETE CASCADE;

ALTER TABLE public.audio_assets 
  ADD CONSTRAINT audio_assets_chapter_id_fkey 
  FOREIGN KEY (chapter_id) 
  REFERENCES bible_schema.chapters(id) 
  ON DELETE CASCADE;

ALTER TABLE public.audio_assets 
  ADD CONSTRAINT audio_assets_version_id_fkey 
  FOREIGN KEY (version_id) 
  REFERENCES bible_schema.bible_versions(id) 
  ON DELETE CASCADE;

-- Add index for audio_id in audio_cues for better performance
CREATE INDEX IF NOT EXISTS idx_audio_cues_audio_id ON public.audio_cues(audio_id);

-- Add index for chapter_id and version_id in audio_assets for better performance
CREATE INDEX IF NOT EXISTS idx_audio_assets_chapter_id ON public.audio_assets(chapter_id);
CREATE INDEX IF NOT EXISTS idx_audio_assets_version_id ON public.audio_assets(version_id);