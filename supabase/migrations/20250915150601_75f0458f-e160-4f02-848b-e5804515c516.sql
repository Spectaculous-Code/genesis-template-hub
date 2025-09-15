-- Fix incorrect book data for 2 Corinthians
-- Update the record that has wrong Finnish names and book order
UPDATE books 
SET 
    name_localized = 'Toinen kirje korinttilaisille',
    name_abbreviation = '2. Kor.',
    book_order = 47
WHERE id = '21efbb3a-e5d2-4487-b315-dcf4103ad263' 
  AND code = '2Cor' 
  AND name_localized = 'Kolmas Johanneksen kirje';