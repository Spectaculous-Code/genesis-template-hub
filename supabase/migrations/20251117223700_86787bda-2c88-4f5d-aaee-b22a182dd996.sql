-- Create app_settings table for storing application configuration
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings
CREATE POLICY "Settings are publicly readable"
  ON public.app_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Authenticated users can update settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert settings
CREATE POLICY "Authenticated users can insert settings"
  ON public.app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add default settings
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('app_url', 'https://9cae91d3-5fc1-4587-a550-1da914e11c66.lovableproject.com', 'Base URL for the application'),
  ('embed_api_url', 'https://iryqgmjauybluwnqhxbg.supabase.co/functions/v1/embed', 'Embed API endpoint URL');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_settings_timestamp
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_app_settings_updated_at();