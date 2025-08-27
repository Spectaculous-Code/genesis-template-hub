-- 1) Canonical verse key (stable addressing across versions)
CREATE TABLE IF NOT EXISTS public.verse_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  osis text UNIQUE NOT NULL,                 -- e.g. 'Gen.1.1'
  book_id uuid NOT NULL REFERENCES public.books(id),
  chapter_number int NOT NULL,
  verse_number int NOT NULL,
  UNIQUE (book_id, chapter_number, verse_number)
);

-- Link verses to the canonical key + enforce one text per version
ALTER TABLE public.verses
  ADD COLUMN IF NOT EXISTS verse_key_id uuid REFERENCES public.verse_keys(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verses_unique_per_version'
  ) THEN
    ALTER TABLE public.verses
      ADD CONSTRAINT verses_unique_per_version UNIQUE (version_id, verse_key_id);
  END IF;
END$$;

-- 2) Tight uniqueness and FKs for fast navigation
-- Books: make order and (optional) code unique/stable
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS code varchar;

CREATE UNIQUE INDEX IF NOT EXISTS books_code_uidx ON public.books(code);
CREATE UNIQUE INDEX IF NOT EXISTS books_order_uidx ON public.books(book_order);

-- Chapters: unique per book
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chapters_unique_per_book'
  ) THEN
    ALTER TABLE public.chapters
      ADD CONSTRAINT chapters_unique_per_book UNIQUE (book_id, chapter_number);
  END IF;
END$$;

-- Verses: unique position inside chapter per version
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'verses_unique_in_chapter_version'
  ) THEN
    ALTER TABLE public.verses
      ADD CONSTRAINT verses_unique_in_chapter_version
      UNIQUE (version_id, chapter_id, verse_number);
  END IF;
END$$;

-- 3) Enums for tight domains (faster, safer than CHECK on varchar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testament_t') THEN
    CREATE TYPE testament_t AS ENUM ('old','new');
  END IF;
END$$;

ALTER TABLE public.books
  ALTER COLUMN testament TYPE testament_t
  USING testament::testament_t;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'history_t') THEN
    CREATE TYPE history_t AS ENUM ('read','listen');
  END IF;
END$$;

ALTER TABLE public.user_reading_history
  ALTER COLUMN history_type TYPE history_t
  USING history_type::history_t;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marking_t') THEN
    CREATE TYPE marking_t AS ENUM ('highlight','comment','like');
  END IF;
END$$;

ALTER TABLE public.user_markings
  ALTER COLUMN marking_type TYPE marking_t
  USING marking_type::marking_t;

-- 4) Reading position: make it resolvable and version-aware
ALTER TABLE public.user_reading_history
  ADD COLUMN IF NOT EXISTS version_id uuid REFERENCES public.bible_versions(id),
  ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES public.chapters(id),
  ADD COLUMN IF NOT EXISTS verse_id uuid REFERENCES public.verses(id);

-- Optional sanity check: at least one locator present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reading_location_any_present'
  ) THEN
    ALTER TABLE public.user_reading_history
      ADD CONSTRAINT reading_location_any_present CHECK (
        chapter_id IS NOT NULL OR verse_id IS NOT NULL
        OR (book_id IS NOT NULL AND chapter_number IS NOT NULL)
      );
  END IF;
END$$;

-- Helpful uniqueness if you want "one latest per user/version/type"
CREATE UNIQUE INDEX IF NOT EXISTS urh_latest_per_user_ver
  ON public.user_reading_history(user_id, version_id, history_type)
  WHERE verse_id IS NOT NULL;

-- 5) Search: make text_search reliable + indexed
ALTER TABLE public.verses
  DROP COLUMN IF EXISTS text_search;

ALTER TABLE public.verses
  ADD COLUMN text_search tsvector
  GENERATED ALWAYS AS (to_tsvector('finnish', coalesce(text,''))) STORED;

CREATE INDEX IF NOT EXISTS verses_text_gin ON public.verses USING GIN (text_search);

-- 6) Audio done right (keep your fields, add scalable tables)
CREATE TABLE IF NOT EXISTS public.audio_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.bible_versions(id),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id),
  file_url text NOT NULL,          -- or storage path if you sign URLs at runtime
  duration_ms int,
  narrator text,
  quality text,                    -- e.g., 'mp3-128', 'aac-64'
  UNIQUE (version_id, chapter_id, quality)
);

CREATE TABLE IF NOT EXISTS public.audio_cues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_id uuid NOT NULL REFERENCES public.audio_assets(id) ON DELETE CASCADE,
  verse_id uuid NOT NULL REFERENCES public.verses(id),
  start_ms int NOT NULL,
  end_ms int,
  UNIQUE (audio_id, verse_id)
);

-- 7) User features: dedupe, integrity, speed
-- Tie bookmarks/highlights to auth.users and avoid duplicates per user/verse
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_user_fk'
  ) THEN
    ALTER TABLE public.bookmarks
      ADD CONSTRAINT bookmarks_user_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_verse_uidx
  ON public.bookmarks(user_id, verse_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'highlights_user_fk'
  ) THEN
    ALTER TABLE public.highlights
      ADD CONSTRAINT highlights_user_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS highlights_user_verse_color_uidx
  ON public.highlights(user_id, verse_id, color);

-- user_markings: useful as a generic table; prevent accidental duplicates
CREATE UNIQUE INDEX IF NOT EXISTS user_markings_user_verse_type_uidx
  ON public.user_markings(user_id, verse_id, marking_type);

-- 8) Profiles: make user_id the PK (simpler joins)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_pkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);

-- 9) Helpful indexes for the hot paths
-- Navigation
CREATE INDEX IF NOT EXISTS chapters_book_idx ON public.chapters(book_id);
CREATE INDEX IF NOT EXISTS verses_chapter_idx ON public.verses(chapter_id);
CREATE INDEX IF NOT EXISTS verses_ver_chap_num_idx ON public.verses(version_id, chapter_id, verse_number);
CREATE INDEX IF NOT EXISTS verses_ver_key_idx ON public.verses(version_id, verse_key_id);

-- User data
CREATE INDEX IF NOT EXISTS user_markings_user_idx ON public.user_markings(user_id);
CREATE INDEX IF NOT EXISTS user_markings_verse_idx ON public.user_markings(verse_id);
CREATE INDEX IF NOT EXISTS bookmarks_user_idx ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS highlights_user_idx ON public.highlights(user_id);

-- 10) Small consistency wins
-- Language sanity (ISO-ish, e.g., 'fi', 'en', 'fi-FI')
ALTER TABLE public.bible_versions
  ADD CONSTRAINT bible_versions_language_chk
  CHECK (char_length(language) BETWEEN 2 AND 10);

-- ON DELETE CASCADE for user-owned rows
ALTER TABLE public.user_markings
  DROP CONSTRAINT IF EXISTS user_markings_user_id_fkey,
  ADD  CONSTRAINT user_markings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_reading_history
  DROP CONSTRAINT IF EXISTS user_reading_history_user_id_fkey,
  ADD  CONSTRAINT user_reading_history_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;