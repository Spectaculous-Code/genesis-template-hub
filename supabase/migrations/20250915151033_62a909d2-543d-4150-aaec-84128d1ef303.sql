-- Fix book data issues in finprfinni version (bc904656-1ccf-474a-bfc8-cca11da6facc)
-- Update book orders and Finnish localizations

-- Fix 1 Thessalonians
UPDATE books 
SET book_order = 52, 
    name_localized = 'Ensimmäinen kirje tessalonikalaisille',
    name_abbreviation = '1. Tess.'
WHERE id = '3e2a0663-db0d-4754-a1b0-f4b5f8585993' 
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 2 Thessalonians  
UPDATE books 
SET book_order = 53,
    name_localized = 'Toinen kirje tessalonikalaisille',
    name_abbreviation = '2. Tess.'
WHERE id = '0fa2adb0-4cb5-402d-87d7-e3d7b80248bf'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 1 Timothy
UPDATE books 
SET book_order = 54,
    name_localized = 'Ensimmäinen kirje Timoteukselle',
    name_abbreviation = '1. Tim.'
WHERE id = '183e9d30-bda7-49fc-a08c-190bb3b8bd71'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 2 Timothy
UPDATE books 
SET book_order = 55,
    name_localized = 'Toinen kirje Timoteukselle', 
    name_abbreviation = '2. Tim.'
WHERE id = 'f73f9731-84c0-4f36-8986-5e0657168ad8'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 1 Peter
UPDATE books 
SET book_order = 60,
    name_localized = 'Ensimmäinen Pietarin kirje',
    name_abbreviation = '1. Piet.'
WHERE id = '4f840d9d-60c6-44e8-9f02-60b7932d0063'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 2 Peter
UPDATE books 
SET book_order = 61,
    name_localized = 'Toinen Pietarin kirje',
    name_abbreviation = '2. Piet.'
WHERE id = 'ba9c7c69-7fa5-435e-9958-6ed9330405f2'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 1 John
UPDATE books 
SET book_order = 62,
    name_localized = 'Ensimmäinen Johanneksen kirje',
    name_abbreviation = '1. Joh.'
WHERE id = '5618fbcb-dd56-46b4-9bbd-8dbad2df06fc'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 2 John  
UPDATE books 
SET book_order = 63,
    name_localized = 'Toinen Johanneksen kirje',
    name_abbreviation = '2. Joh.'
WHERE id = 'f244ba04-b48d-48b9-8c02-d9366cda2585'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 3 John
UPDATE books 
SET book_order = 64,
    name_localized = 'Kolmas Johanneksen kirje',
    name_abbreviation = '3. Joh.'
WHERE id = '31381b44-7ca3-41be-8f5b-21b8623f9094'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Revelation
UPDATE books 
SET book_order = 66,
    name_localized = 'Johanneksen ilmestys',
    name_abbreviation = 'Ilm.'
WHERE id = 'debd47bf-0776-4dde-ba88-890e2df60dbd'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';