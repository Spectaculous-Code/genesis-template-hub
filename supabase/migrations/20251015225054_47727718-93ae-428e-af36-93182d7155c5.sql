-- Enable pg_trgm extension for trigram-based substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram GIN index on verses.text for fast substring matching
-- This will significantly speed up ILIKE queries
CREATE INDEX IF NOT EXISTS verses_text_trgm_idx 
ON bible_schema.verses 
USING gin (text gin_trgm_ops);

-- Note: This index will make ILIKE searches much faster automatically
-- Example: searching for "yhdeksän" will now quickly find "yhdeksänsataa"