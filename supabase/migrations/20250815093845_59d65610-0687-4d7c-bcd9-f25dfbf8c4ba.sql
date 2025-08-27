-- Create function to get KJV verse with Strong's numbers
CREATE OR REPLACE FUNCTION public.get_kjv_verse_with_strongs(p_osis text)
RETURNS TABLE(
  osis text,
  plain_text text,
  tagged_text text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH kv AS (
    SELECT id FROM public.bible_versions WHERE code = 'KJV'
  )
  SELECT 
    vk.osis,
    v.text AS plain_text,
    COALESCE(
      STRING_AGG(
        w.word_text ||
        COALESCE(
          CASE 
            WHEN w.strongs_number IS NOT NULL AND w.strongs_number != '' 
            THEN '<' || w.strongs_number || '>'
            ELSE ''
          END,
          ''
        ),
        ' ' ORDER BY w.word_order
      ),
      v.text
    ) AS tagged_text
  FROM public.verses v
  JOIN public.verse_keys vk ON vk.id = v.verse_key_id
  LEFT JOIN public.kjv_strongs_words w ON w.verse_id = v.id
  WHERE v.version_id = (SELECT id FROM kv) 
    AND vk.osis = p_osis
    AND v.is_superseded = false
  GROUP BY vk.osis, v.text;
END;
$$;