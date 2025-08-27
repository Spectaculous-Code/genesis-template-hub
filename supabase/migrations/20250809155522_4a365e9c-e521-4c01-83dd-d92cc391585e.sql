-- Handle enum conversion with defaults properly

-- 1) Create the enums first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testament_t') THEN
    CREATE TYPE testament_t AS ENUM ('old','new');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'history_t') THEN
    CREATE TYPE history_t AS ENUM ('read','listen');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marking_t') THEN
    CREATE TYPE marking_t AS ENUM ('highlight','comment','like');
  END IF;
END$$;

-- 2) Fix history_type column with proper handling of default
ALTER TABLE public.user_reading_history 
  ALTER COLUMN history_type DROP DEFAULT;

ALTER TABLE public.user_reading_history
  ALTER COLUMN history_type TYPE history_t
  USING history_type::history_t;

ALTER TABLE public.user_reading_history
  ALTER COLUMN history_type SET DEFAULT 'read'::history_t;

-- 3) Fix testament column
ALTER TABLE public.books
  ALTER COLUMN testament TYPE testament_t
  USING testament::testament_t;

-- 4) Fix marking_type column
ALTER TABLE public.user_markings
  ALTER COLUMN marking_type TYPE marking_t
  USING marking_type::marking_t;