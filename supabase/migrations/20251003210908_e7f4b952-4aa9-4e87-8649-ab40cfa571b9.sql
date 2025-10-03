-- Migration to remap kjv_strongs_words and strongs_mappings verse IDs to current bible_schema verses

-- Step 1: Create temporary mapping table
CREATE TEMP TABLE verse_id_mapping AS
SELECT DISTINCT
  ksw.verse_id AS old_verse_id,
  v_new.id AS new_verse_id,
  vk.osis
FROM public.kjv_strongs_words ksw
-- Get the OSIS from the old verse through verse_keys
JOIN bible_schema.verse_keys vk_old ON vk_old.id = (
  SELECT verse_key_id FROM bible_schema.verses WHERE id = ksw.verse_id
)
-- Find the corresponding verse in current schema using OSIS
JOIN bible_schema.verse_keys vk ON vk.osis = vk_old.osis
JOIN bible_schema.verses v_new ON v_new.verse_key_id = vk.id
JOIN bible_schema.bible_versions bv ON bv.id = v_new.version_id AND bv.code = 'KJV'
WHERE v_new.is_superseded = false;

-- Show mapping stats
DO $$
DECLARE
  mapping_count INTEGER;
  kjv_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO mapping_count FROM verse_id_mapping;
  SELECT COUNT(DISTINCT verse_id) INTO kjv_total FROM public.kjv_strongs_words;
  
  RAISE NOTICE 'Found % verse ID mappings out of % unique verses in kjv_strongs_words', mapping_count, kjv_total;
END $$;

-- Step 2: Update kjv_strongs_words with new verse IDs
UPDATE public.kjv_strongs_words ksw
SET verse_id = vim.new_verse_id
FROM verse_id_mapping vim
WHERE ksw.verse_id = vim.old_verse_id;

-- Step 3: Update strongs_mappings with new verse IDs
UPDATE public.strongs_mappings sm
SET verse_id = vim.new_verse_id
FROM verse_id_mapping vim
WHERE sm.verse_id = vim.old_verse_id;

-- Step 4: Delete orphaned records (verses that couldn't be mapped)
DELETE FROM public.kjv_strongs_words
WHERE NOT EXISTS (
  SELECT 1 FROM bible_schema.verses v WHERE v.id = kjv_strongs_words.verse_id
);

DELETE FROM public.strongs_mappings
WHERE NOT EXISTS (
  SELECT 1 FROM bible_schema.verses v WHERE v.id = strongs_mappings.verse_id
);

-- Show results
DO $$
DECLARE
  kjv_count INTEGER;
  mappings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO kjv_count FROM public.kjv_strongs_words;
  SELECT COUNT(*) INTO mappings_count FROM public.strongs_mappings;
  
  RAISE NOTICE 'Updated records: % in kjv_strongs_words, % in strongs_mappings', kjv_count, mappings_count;
END $$;