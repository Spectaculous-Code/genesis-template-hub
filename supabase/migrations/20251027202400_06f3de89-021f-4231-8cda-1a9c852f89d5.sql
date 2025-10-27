-- Create storage bucket for audio chapters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-chapters',
  'audio-chapters',
  true,
  52428800, -- 50MB max per file
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
);

-- RLS Policy: Public read access to audio files
CREATE POLICY "Public read access to audio chapters"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-chapters');

-- RLS Policy: Service role can insert audio files (for edge function)
CREATE POLICY "Service role can upload audio chapters"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audio-chapters');

-- RLS Policy: Service role can update audio files
CREATE POLICY "Service role can update audio chapters"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'audio-chapters');

-- Add index to audio_assets for faster lookups by chapter_id and version_id
CREATE INDEX IF NOT EXISTS idx_audio_assets_chapter_version 
ON audio_assets(chapter_id, version_id);

-- Add index to audio_cues for faster lookups by audio_id
CREATE INDEX IF NOT EXISTS idx_audio_cues_audio_id 
ON audio_cues(audio_id);

-- Add index to audio_cues for verse-based lookups
CREATE INDEX IF NOT EXISTS idx_audio_cues_verse_id 
ON audio_cues(verse_id);