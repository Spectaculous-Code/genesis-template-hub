# Developer Notes — Bible Lookup

- Always use the database RPC functions instead of chaining multiple queries.
  - **Single verse** → public.get_verse_by_ref(p_ref_book, p_chapter, p_verse, p_version_code, p_language_code)
  - **Full chapter** → public.get_chapter_by_ref(p_ref_book, p_chapter, p_version_code, p_language_code)
  - **Verse range** / list → public.get_verses_by_ref(p_ref_book, p_chapter, p_verses, p_version_code, p_language_code)
  -   p_verses = NULL ⇒ return all verses of the chapter.
  - **Text search** → public.search_text(p_query, p_version_code, p_limit)

----
Default Behavior
	•	If version_code is NULL or 'default' ⇒ use finstlk201.
	•	Book input can be any alias:
	•	Examples: "Matt.", "Matteus", "Matthew"
	•	Aliases resolved via book_aliases table or fuzzy matching on normalized book fields.

⸻

Performance
	•	Chapter/verse lookups are O(1) via composite index:
(version_id, book_id, chapter_number, verse_number)
	•	Text search uses GIN index on verses.text_search (tsvector).
	•	Performance tests assert <20ms for single-verse lookup (warm).

⸻

Frontend Usage
	•	DO call the RPC functions via supabase.rpc(...).
	•	DON’T join raw tables (verses, books, chapters) in the frontend.
	•	Parsing:
	•	performSearch(query) decides:
	•	If query parses as reference → call get_verse* / get_chapter*.
	•	Otherwise → call search_text.

⸻
Tests  
- For tests:
  - Run `SELECT * FROM bible_test.run_all_tests();` in SQL IDE to verify schema + lookup logic.
  - Use fixtures in `bible_test.verse_fixtures` for golden-verse checks.

