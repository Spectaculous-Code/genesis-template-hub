-- Drop legacy unique constraint that conflicts with per-chapter/history upserts
ALTER TABLE public.user_reading_history
  DROP CONSTRAINT IF EXISTS user_reading_history_user_id_book_id_key;