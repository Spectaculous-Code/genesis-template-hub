# Product Requirements Document (PRD)

## 1. Vision & Users
- App: Guardian Network / Waara (safety + everyday travel)
- Tone/brand: strong but warm; safety + adventure
- Primary users: families, individuals needing trip safety, guardians

## 2. Objectives (Top 3)
1) Fast, reliable trip logging + live status
2) Guardian approvals & alerts with minimal friction
3) Privacy-first data handling

## 3. Scope (MVP)
- Must: auth (Supabase), profiles, trips (create/start/finish), guardian link, live location ping, alerts
- Should: milestones, notes, basic analytics
- Won’t (now): full offline maps, billing

## 4. Success Metrics
- TTFU (time-to-first-use) < 3 min
- Trip start success > 95%
- Crash-free sessions > 99.5%

## 5. UX Principles
- Clear “Start/Stop Trip” CTA
- 3-tap max to share status
- Accessible (WCAG AA)

## 6. Non-Goals
- No enterprise SSO, no multi-tenant admin (MVP)

## 7. Risks & Guardrails
- Safety-critical messaging → retries + rate limits
- PII minimization: store only necessary fields
- Add security logging on auth/trip mutations

## 8. Tech Constraints
- Frontend: Vite + React + TypeScript + shadcn + Tailwind
- Backend: Supabase (Postgres, RLS, Auth), Edge Functions optional
- API style: tRPC or REST (choose one in 03-API)
- Testing: Vitest + Playwright

## 9. Deliverables
- MVP feature list above
- Unit/E2E tests
- Deployment docs

## 10. Open Questions
- Do we need guardian SMS fallback?
- Exact location ping interval?
