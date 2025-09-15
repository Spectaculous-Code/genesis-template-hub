-- Fix the remaining books with incorrect book orders in finprfinni version

-- Fix Philippians
UPDATE books 
SET book_order = 50,
    name_abbreviation = 'Fil.'
WHERE id = '9738002c-31a8-4778-8b3d-1fdd7a17f947'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Colossians  
UPDATE books 
SET book_order = 51,
    name_abbreviation = 'Kol.'
WHERE id = '0762f321-22db-4cfb-bc3c-f7c1cb58bddc'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Titus
UPDATE books 
SET book_order = 56,
    name_abbreviation = 'Tiit.'
WHERE id = 'b2c6336d-bb94-4792-b0c1-414ea701ddc6'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Philemon
UPDATE books 
SET book_order = 57,
    name_abbreviation = 'Filem.'
WHERE id = 'cdfbca2a-e41b-480a-988f-33db217d5411'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Hebrews
UPDATE books 
SET book_order = 58,
    name_abbreviation = 'Hebr.'
WHERE id = '4513982b-b2ab-4393-9281-a55d62809812'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix James
UPDATE books 
SET book_order = 59,
    name_abbreviation = 'Jaak.'
WHERE id = '8705d6af-fba6-481d-98dc-5dd8ca164b32'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';

-- Fix Jude
UPDATE books 
SET book_order = 65,
    name_abbreviation = 'Juud.'
WHERE id = '43b11c24-4e57-43a6-a1a1-63dfb6f14d01'
  AND version_id = 'bc904656-1ccf-474a-bfc8-cca11da6facc';