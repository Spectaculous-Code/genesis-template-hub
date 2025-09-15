-- Move more conflicting books to temporary positions to resolve systematic data corruption
-- Move Matthew, Mark, Luke, Galatians to temporary positions first

UPDATE books SET book_order = 1057 WHERE id = '50ac261d-d6f6-4c12-b405-9a5eb85a267b' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- Matthew
UPDATE books SET book_order = 1058 WHERE id = 'e412cbf6-9740-4930-b20c-cc7814405a40' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- Mark  
UPDATE books SET book_order = 1059 WHERE id = '602aa33f-3627-48f8-962d-6ce0ec39327b' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- Luke
UPDATE books SET book_order = 1065 WHERE id = '4f9ea888-d519-4240-ad0a-073f01a6c20d' AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc'; -- Galatians

-- Now fix the remaining books with correct book orders and names
-- Fix Philippians
UPDATE books 
SET book_order = 50
WHERE id = '9738002c-31a8-4778-8b3d-1fdd7a17f947'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Colossians  
UPDATE books 
SET book_order = 51
WHERE id = '0762f321-22db-4cfb-bc3c-f7c1cb58bddc'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Titus
UPDATE books 
SET book_order = 56
WHERE id = 'b2c6336d-bb94-4792-b0c1-414ea701ddc6'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Philemon
UPDATE books 
SET book_order = 57
WHERE id = 'cdfbca2a-e41b-480a-988f-33db217d5411'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Hebrews
UPDATE books 
SET book_order = 58
WHERE id = '4513982b-b2ab-4393-9281-a55d62809812'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix James
UPDATE books 
SET book_order = 59
WHERE id = '8705d6af-fba6-481d-98dc-5dd8ca164b32'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Jude
UPDATE books 
SET book_order = 65
WHERE id = '43b11c24-4e57-43a6-a1a1-63dfb6f14d01'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix the books that had wrong Finnish names
-- Fix Matthew (should have proper Finnish name, not Philemon's name)
UPDATE books 
SET book_order = 40,
    name_localized = 'Matteuksen evankeliumi',
    name_abbreviation = 'Matt.'
WHERE id = '50ac261d-d6f6-4c12-b405-9a5eb85a267b'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Mark (should have proper Finnish name, not Hebrews' name)
UPDATE books 
SET book_order = 41,
    name_localized = 'Markuksen evankeliumi',
    name_abbreviation = 'Mark.'
WHERE id = 'e412cbf6-9740-4930-b20c-cc7814405a40'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Luke (should have proper Finnish name, not James' name)
UPDATE books 
SET book_order = 42,
    name_localized = 'Luukkaan evankeliumi',
    name_abbreviation = 'Luuk.'
WHERE id = '602aa33f-3627-48f8-962d-6ce0ec39327b'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Galatians (should have proper Finnish name, not Jude's name)
UPDATE books 
SET book_order = 48,
    name_localized = 'Kirje galatalaisille',
    name_abbreviation = 'Gal.'
WHERE id = '4f9ea888-d519-4240-ad0a-073f01a6c20d'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';