-- Add version_id column to summary_bible_references table
ALTER TABLE public.summary_bible_references 
ADD COLUMN version_id uuid REFERENCES public.bible_versions(id);

-- Create index for performance
CREATE INDEX idx_summary_bible_references_version_id ON public.summary_bible_references(version_id);