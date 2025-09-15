-- Continue fixing the remaining books in finprfinni version
-- Fix Peter, John, and Revelation books

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

-- Now fix the books that had incorrect Finnish names assigned
-- Fix John (should have proper Finnish name, not Peter's name)
UPDATE books 
SET book_order = 43,
    name_localized = 'Johanneksen evankeliumi',
    name_abbreviation = 'Joh.'
WHERE id = 'f8f29b50-799c-4a58-9645-c631504d5f00'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Acts (should have proper Finnish name, not Peter's name)
UPDATE books 
SET book_order = 44,
    name_localized = 'Apostolien teot',
    name_abbreviation = 'Apt.'
WHERE id = 'ba80ef3b-22d9-4463-a1bb-178c8d5692b8'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Romans (should have proper Finnish name, not John's name)
UPDATE books 
SET book_order = 45,
    name_localized = 'Kirje roomalaisille',
    name_abbreviation = 'Room.'
WHERE id = 'c3c2ad84-871f-43c9-b51d-247908b023a9'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix 1 Corinthians (should have proper Finnish name, not John's name)
UPDATE books 
SET book_order = 46,
    name_localized = 'Ensimmäinen kirje korinttilaisille',
    name_abbreviation = '1. Kor.'
WHERE id = '2d179cba-06d4-4924-a484-1a6f94f6d352'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Ephesians (should have proper Finnish name, not Revelation's name)
UPDATE books 
SET book_order = 49,
    name_localized = 'Kirje efesolaisille',
    name_abbreviation = 'Ef.'
WHERE id = 'a36d4ee2-baf3-43d8-a288-56a973ad3ce8'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';