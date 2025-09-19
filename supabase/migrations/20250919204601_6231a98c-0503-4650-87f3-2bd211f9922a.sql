-- Grant usage on bible_schema to authenticator role
GRANT USAGE ON SCHEMA bible_schema TO authenticator;
GRANT USAGE ON SCHEMA bible_schema TO anon;
GRANT USAGE ON SCHEMA bible_schema TO authenticated;

-- Grant select permissions on all tables in bible_schema
GRANT SELECT ON ALL TABLES IN SCHEMA bible_schema TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA bible_schema TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA bible_schema TO authenticated;

-- Grant usage on sequences in bible_schema (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA bible_schema TO authenticator;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA bible_schema TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA bible_schema TO authenticated;

-- Enable RLS on key Bible content tables and create public read policies
ALTER TABLE bible_schema.bible_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bible versions are publicly readable" ON bible_schema.bible_versions FOR SELECT USING (true);

ALTER TABLE bible_schema.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Books are publicly readable" ON bible_schema.books FOR SELECT USING (true);

ALTER TABLE bible_schema.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chapters are publicly readable" ON bible_schema.chapters FOR SELECT USING (true);

ALTER TABLE bible_schema.verses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verses are publicly readable" ON bible_schema.verses FOR SELECT USING (true);

-- If verse_keys table exists in bible_schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bible_schema' AND table_name = 'verse_keys') THEN
        ALTER TABLE bible_schema.verse_keys ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "Verse keys are publicly readable" ON bible_schema.verse_keys FOR SELECT USING (true)';
    END IF;
END$$;

-- If strongs tables exist in bible_schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bible_schema' AND table_name = 'strongs_lexicon') THEN
        ALTER TABLE bible_schema.strongs_lexicon ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "Strongs lexicon is publicly readable" ON bible_schema.strongs_lexicon FOR SELECT USING (true)';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bible_schema' AND table_name = 'strongs_mappings') THEN
        ALTER TABLE bible_schema.strongs_mappings ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "Strongs mappings are publicly readable" ON bible_schema.strongs_mappings FOR SELECT USING (true)';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bible_schema' AND table_name = 'kjv_strongs_words') THEN
        ALTER TABLE bible_schema.kjv_strongs_words ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "KJV Strongs words are publicly readable" ON bible_schema.kjv_strongs_words FOR SELECT USING (true)';
    END IF;
END$$;

-- Grant future table permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA bible_schema GRANT SELECT ON TABLES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA bible_schema GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA bible_schema GRANT SELECT ON TABLES TO authenticated;