-- Add display_code column to bible_versions table for user-friendly abbreviations
ALTER TABLE public.bible_versions 
ADD COLUMN display_code character varying(10);

-- Add some example display codes based on the examples provided
UPDATE public.bible_versions 
SET display_code = CASE 
  WHEN code = 'finprfinni' THEN 'KR38'
  WHEN code = 'fin2017' THEN 'fin2017' 
  WHEN code = 'KJV' THEN 'KJV'
  ELSE code -- fallback to using code as display_code for other versions
END;