-- Fix duplicate book orders by reassigning sequential orders
WITH ordered_books AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as new_order
  FROM books
)
UPDATE books 
SET book_order = ordered_books.new_order
FROM ordered_books 
WHERE books.id = ordered_books.id;