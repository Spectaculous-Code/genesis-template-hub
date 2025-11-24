-- Drop the old foreign key constraint that points to public.bible_versions
ALTER TABLE public.summary_bible_references 
DROP CONSTRAINT IF EXISTS summary_bible_references_version_id_fkey;

-- Add new foreign key constraint pointing to bible_schema.bible_versions
ALTER TABLE public.summary_bible_references 
ADD CONSTRAINT summary_bible_references_version_id_fkey 
FOREIGN KEY (version_id) 
REFERENCES bible_schema.bible_versions(id);