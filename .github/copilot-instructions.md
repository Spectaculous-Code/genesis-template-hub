# Repository Instructions for Copilot

## Project
- Vite + React + TypeScript. Use functional components, hooks, and strict TS.
- UI: Tailwind + shadcn/ui (compose primitives; avoid inline styles when a utility class exists).
- Data: Supabase client in `src/lib/supabase.ts`. Never bypass RLS; do not expose service role in frontend.
- Testing: prefer lightweight unit tests; keep e2e in separate workflows.

## Code Review focus
1. **TypeScript**
   - No `any`. Prefer strict typing with generics and `zod` DTOs in `src/zod/`.
   - Catch narrowings for nullable Supabase results.
2. **React**
   - Hooks rules; memoize expensive selectors; avoid re-renders in large lists.
   - Accessibility: label inputs, keyboard nav, focus traps for dialogs.
3. **shadcn/ui**
   - Follow composition patterns; avoid prop drilling > 2 levels—lift state or use context.
4. **Supabase & Security**
   - Assume RLS enforced. Call DB RPCs or typed clients; do not duplicate access logic in UI.
   - Never log secrets/tokens; validate all inputs (server and client).
5. **Performance**
   - Code-split routes; lazy-load heavy chunks; prefetch critical data.
   - Avoid unbounded list rendering; use virtualization for large results.
6. **PR Review Output**
   - Be concise. Use bullets and specific file/line references.
   - When suggesting code, provide minimal diff-style blocks.
