# Developer Notes — Bible Lookup

- Always use the database RPC functions instead of chaining multiple queries.
  - For **single verse** → use `public.get_verse_by_ref()`.
  - For **full chapter** → use `public.get_chapter_by_ref()`.
- Do **not** re-implement book/alias resolution in frontend — the DB functions already normalize inputs.
- Default behavior:
  - If `version_code` is NULL or 'default' ⇒ use `finstlk201`.
  - Aliases (e.g. "Matt.", "Matteus", "Matthew") are resolved by `book_aliases` or fuzzy match.
- For tests:
  - Run `SELECT * FROM bible_test.run_all_tests();` in SQL IDE to verify schema + lookup logic.
  - Use fixtures in `bible_test.verse_fixtures` for golden-verse checks.
- Performance: chapter/verse lookup is O(1) via composite indexes on `(version_id, book_id, chapter_number, verse_number)`.
