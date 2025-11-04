-- Deduplicate existing rows to allow unique constraint
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, book_id, chapter_number, history_type
           ORDER BY last_read_at DESC, id
         ) AS rn
  FROM public.user_reading_history
)
DELETE FROM public.user_reading_history u
USING ranked r
WHERE u.id = r.id
  AND r.rn > 1;

-- Add unique constraint for upsert target
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'user_reading_history_uq'
    AND    conrelid = 'public.user_reading_history'::regclass
  ) THEN
    ALTER TABLE public.user_reading_history
      ADD CONSTRAINT user_reading_history_uq
      UNIQUE (user_id, book_id, chapter_number, history_type);
  END IF;
END $$;

-- Helpful index for latest position lookups
CREATE INDEX IF NOT EXISTS idx_user_reading_history_user_lastread
  ON public.user_reading_history (user_id, last_read_at DESC);
