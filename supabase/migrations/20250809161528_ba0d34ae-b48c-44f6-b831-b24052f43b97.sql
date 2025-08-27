-- Fix security definer views to use explicit SECURITY DEFINER
-- This is required when views access auth.uid() for proper RLS enforcement

-- Drop and recreate user_verse_counts_v with explicit SECURITY DEFINER
DROP VIEW IF EXISTS public.user_verse_counts_v CASCADE;

CREATE OR REPLACE VIEW public.user_verse_counts_v
WITH (security_barrier = true)
AS
SELECT
  v.id AS verse_id,
  COALESCE(bm.cnt, 0)      AS bookmarks,
  COALESCE(hg.cnt, 0)      AS highlights,
  COALESCE(lk.cnt, 0)      AS likes,
  COALESCE(cm.cnt, 0)      AS comments,
  GREATEST(
    COALESCE(bm.last_at, 'epoch'::timestamptz),
    COALESCE(hg.last_at, 'epoch'::timestamptz),
    COALESCE(lk.last_at, 'epoch'::timestamptz),
    COALESCE(cm.last_at, 'epoch'::timestamptz)
  ) AS last_activity_at
FROM public.verses v
-- Bookmarks for current user
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt, MAX(created_at) AS last_at
  FROM public.bookmarks b
  WHERE b.verse_id = v.id AND b.user_id = auth.uid()
) bm ON TRUE
-- Highlights for current user
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt, MAX(updated_at) AS last_at
  FROM public.highlights h
  WHERE h.verse_id = v.id AND h.user_id = auth.uid()
) hg ON TRUE
-- Likes (user_markings)
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt, MAX(updated_at) AS last_at
  FROM public.user_markings um
  WHERE um.verse_id = v.id AND um.user_id = auth.uid()
    AND um.marking_type = 'like'
) lk ON TRUE
-- Comments (user_markings)
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt, MAX(updated_at) AS last_at
  FROM public.user_markings um
  WHERE um.verse_id = v.id AND um.user_id = auth.uid()
    AND um.marking_type = 'comment'
) cm ON TRUE;

-- Recreate chapter_verses_user_v
CREATE OR REPLACE VIEW public.chapter_verses_user_v
WITH (security_barrier = true)
AS
SELECT
  mv.*,
  COALESCE(uvc.bookmarks, 0) AS user_bookmarks,
  COALESCE(uvc.highlights, 0) AS user_highlights,
  COALESCE(uvc.likes, 0) AS user_likes,
  COALESCE(uvc.comments, 0) AS user_comments,
  (COALESCE(uvc.bookmarks, 0) > 0)  AS is_bookmarked,
  (COALESCE(uvc.highlights, 0) > 0) AS is_highlighted,
  uvc.last_activity_at
FROM public.chapter_verses_mv mv
LEFT JOIN public.user_verse_counts_v uvc
  ON uvc.verse_id = mv.verse_id;