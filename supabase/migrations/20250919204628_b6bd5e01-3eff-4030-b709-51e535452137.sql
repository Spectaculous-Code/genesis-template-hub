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

-- Grant future table permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA bible_schema GRANT SELECT ON TABLES TO authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA bible_schema GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA bible_schema GRANT SELECT ON TABLES TO authenticated;

-- Enable RLS and create policies only if they don't exist
DO $$
BEGIN
    -- Bible versions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bible_schema' AND table_name = 'bible_versions') THEN
        ALTER TABLE bible_schema.bible_versions ENABLE ROW LEVEL SECURITY;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'bible_schema' AND tablename = 'bible_versions' AND policyname = 'Bible versions are publicly readable') THEN
            CREATE POLICY "Bible versions are publicly readable" ON bible_schema.bible_versions FOR SELECT USING (true);
        END IF;
    END IF;

    -- Books
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bible_schema' AND table_name = 'books') THEN
        ALTER TABLE bible_schema.books ENABLE ROW LEVEL SECURITY;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'bible_schema' AND tablename = 'books' AND policyname = 'Books are publicly readable') THEN
            CREATE POLICY "Books are publicly readable" ON bible_schema.books FOR SELECT USING (true);
        END IF;
    END IF;

    -- Chapters
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bible_schema' AND table_name = 'chapters') THEN
        ALTER TABLE bible_schema.chapters ENABLE ROW LEVEL SECURITY;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'bible_schema' AND tablename = 'chapters' AND policyname = 'Chapters are publicly readable') THEN
            CREATE POLICY "Chapters are publicly readable" ON bible_schema.chapters FOR SELECT USING (true);
        END IF;
    END IF;

    -- Verses
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bible_schema' AND table_name = 'verses') THEN
        ALTER TABLE bible_schema.verses ENABLE ROW LEVEL SECURITY;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'bible_schema' AND tablename = 'verses' AND policyname = 'Verses are publicly readable') THEN
            CREATE POLICY "Verses are publicly readable" ON bible_schema.verses FOR SELECT USING (true);
        END IF;
    END IF;
END$$;