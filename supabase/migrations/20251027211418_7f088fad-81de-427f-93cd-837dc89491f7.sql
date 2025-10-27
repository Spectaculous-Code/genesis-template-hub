-- Laajenna audio_assets reader-tukea ja hash-indeksointia varten
ALTER TABLE public.audio_assets
  ADD COLUMN IF NOT EXISTS hash text,
  ADD COLUMN IF NOT EXISTS scope text CHECK (scope IN ('verse','chapter')),
  ADD COLUMN IF NOT EXISTS version_code text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS voice text,
  ADD COLUMN IF NOT EXISTS tts_provider text,
  ADD COLUMN IF NOT EXISTS reader_key text;

-- Uniikki indeksi hashille (estää duplikaatit)
CREATE UNIQUE INDEX IF NOT EXISTS uq_audio_assets_hash 
  ON public.audio_assets(hash)
  WHERE hash IS NOT NULL;

-- Reader-avaimella haku
CREATE INDEX IF NOT EXISTS idx_audio_assets_reader 
  ON public.audio_assets(reader_key)
  WHERE reader_key IS NOT NULL;

-- Scope + chapter_id haku (chapter-tason audiota varten)
CREATE INDEX IF NOT EXISTS idx_audio_assets_scope_chapter 
  ON public.audio_assets(scope, chapter_id) 
  WHERE scope = 'chapter';