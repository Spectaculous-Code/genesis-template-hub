-- Fix systematic data corruption in finprfinni version
-- First, move conflicting books to temporary high book orders to avoid constraint violations

-- Move conflicting books to temporary orders (1000+)
UPDATE books SET book_order = 1060 WHERE id = 'f8f29b50-799c-4a58-9645-c631504d5f00' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- John
UPDATE books SET book_order = 1061 WHERE id = 'ba80ef3b-22d9-4463-a1bb-178c8d5692b8' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- Acts  
UPDATE books SET book_order = 1062 WHERE id = 'c3c2ad84-871f-43c9-b51d-247908b023a9' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- Romans
UPDATE books SET book_order = 1063 WHERE id = '2d179cba-06d4-4924-a484-1a6f94f6d352' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- 1 Cor
UPDATE books SET book_order = 1066 WHERE id = 'a36d4ee2-baf3-43d8-a288-56a973ad3ce8' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- Ephesians

-- Now fix the books that were in wrong positions
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