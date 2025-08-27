-- Enable RLS on new tables and create appropriate policies

-- Enable RLS on verse_keys (publicly readable)
ALTER TABLE public.verse_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verse keys are publicly readable" 
ON public.verse_keys 
FOR SELECT 
USING (true);

-- Enable RLS on audio_assets (publicly readable)
ALTER TABLE public.audio_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audio assets are publicly readable" 
ON public.audio_assets 
FOR SELECT 
USING (true);

-- Enable RLS on audio_cues (publicly readable)
ALTER TABLE public.audio_cues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audio cues are publicly readable" 
ON public.audio_cues 
FOR SELECT 
USING (true);