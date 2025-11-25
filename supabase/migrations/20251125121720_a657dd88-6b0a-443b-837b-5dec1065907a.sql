-- Create video_series table for series metadata
CREATE TABLE IF NOT EXISTS public.video_series (
  slug text PRIMARY KEY,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create video_clips table for individual videos
CREATE TABLE IF NOT EXISTS public.video_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_slug text NOT NULL REFERENCES public.video_series(slug) ON DELETE CASCADE,
  order_index int NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  host_type text NOT NULL DEFAULT 'youtube',
  host_video_id text NOT NULL,
  thumbnail_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(series_slug, order_index)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS video_clips_series_order_idx 
  ON public.video_clips (series_slug, order_index);

-- Enable RLS
ALTER TABLE public.video_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;

-- RLS policies for public read access
CREATE POLICY "Video series are publicly readable" 
  ON public.video_series 
  FOR SELECT 
  USING (true);

CREATE POLICY "Video clips are publicly readable" 
  ON public.video_clips 
  FOR SELECT 
  USING (is_published = true);

-- Insert example series
INSERT INTO public.video_series (slug, title, description) VALUES
('JOH', 'Johanneksen evankeliumi', 'Lyhyitä videoita Johanneksen evankeliumista')
ON CONFLICT (slug) DO NOTHING;