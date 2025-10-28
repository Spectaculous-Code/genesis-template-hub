-- Create user_voice_preferences table
CREATE TABLE IF NOT EXISTS public.user_voice_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_id UUID NOT NULL,
  voice_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, version_id)
);

-- Enable RLS
ALTER TABLE public.user_voice_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own voice preferences"
  ON public.user_voice_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice preferences"
  ON public.user_voice_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice preferences"
  ON public.user_voice_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice preferences"
  ON public.user_voice_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_voice_preferences_user_version 
  ON public.user_voice_preferences(user_id, version_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_voice_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_voice_preferences_updated_at
  BEFORE UPDATE ON public.user_voice_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_voice_preferences_updated_at();