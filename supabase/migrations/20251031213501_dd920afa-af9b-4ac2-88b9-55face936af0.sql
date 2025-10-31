-- Fix foreign key constraints in audio_assets to point to bible_schema

-- Drop existing foreign key constraints
ALTER TABLE public.audio_assets 
DROP CONSTRAINT IF EXISTS audio_assets_version_id_fkey;

ALTER TABLE public.audio_assets 
DROP CONSTRAINT IF EXISTS audio_assets_chapter_id_fkey;

-- Recreate foreign key constraints pointing to bible_schema
ALTER TABLE public.audio_assets
ADD CONSTRAINT audio_assets_version_id_fkey 
FOREIGN KEY (version_id) REFERENCES bible_schema.bible_versions(id);

ALTER TABLE public.audio_assets
ADD CONSTRAINT audio_assets_chapter_id_fkey 
FOREIGN KEY (chapter_id) REFERENCES bible_schema.chapters(id);