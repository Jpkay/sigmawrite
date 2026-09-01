# Plume — French mastery platform

Plume is a minors-first French learning platform for secondary students. It combines an atomic competency graph, adaptive diagnostics, graph-driven practice, controlled reading, writing feedback, retrieval scheduling, a flat vocabulary-memory tier, parent/teacher evidence, and human-governed AI content operations.

## Current engineering state

The repository contains the production application and its staging/pilot hardening work. Passing unit tests or a successful build do **not** by themselves mean the product is publicly launched. The authoritative distinction between repository work and external launch gates is in [`docs/implementation-status.md`](./docs/implementation-status.md) and [`docs/launch-gates.md`](./docs/launch-gates.md).

Recent hardening includes:

- database-owned authorization roles and least-privilege RLS;
- immediate class-invitation authorization at every student age, with no second consent waiting screen;
- username-or-email login, managed temporary credentials, forced first-login password rotation, and recovery handoff for accounts without email;
- school-scoped supervisor visibility plus optional class/student assignments;
- authenticated-cache isolation and functional password recovery;
- idempotent background reports, notices and deletion claiming;
- Next.js dependency security updates and zero known `npm audit` findings;
- Playwright browser, mobile-navigation, PWA-isolation and axe checks;
- per-word FSRS vocabulary practice;
- persistent, fading tutoring scaffolds and graph-guided remediation;
- live deterministic conjugation plus LanguageTool agreement validation.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase Auth/Postgres/RLS/pgvector · Zod · Vitest · Playwright/axe · Sentry · PostHog · Resend · OpenAI-compatible/GLM providers.

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

A keyless environment is useful for UI and pure-domain development, but hosted learning requires Supabase. Mock AI is deliberately rejected by the launch verifier.

Local Supabase:

```bash
supabase start
npm run seed:demo
supabase test db
```

Do not run seeds or generated imports against production without verifying `SUPABASE_PROJECT_REF` and following the release document for that artifact.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run security:audit
npm run test:e2e        # requires: npx playwright install chromium
npm run ci              # application release gates
npm run launch:verify-env
npm run launch:audit-content
supabase test db         # complete database contract suite
```

CI runs the application gates, a fresh Supabase migration plus the complete SQL test directory, and browser/accessibility checks.

## Architecture boundaries

- **Authorization:** roles come from `profiles.role`; Auth user metadata is never an authorization source. RLS is the final data boundary.
- **Evidence:** student answers and mastery evidence are relational and reference immutable/versioned content.
- **AI:** models propose or evaluate bounded content. Deterministic validators, QA gates, human review and release policies decide whether it is served.
- **Safety:** student free text is moderated; there is no open student AI chat.
- **Memory:** retrieval uses DSR/FSRS-style state; competency mastery decays with retrievability and encompassing nodes receive fractional implicit repetition.
- **Vocabulary:** words remain a flat frequency-oriented memory tier rather than bloating the competency DAG.
- **Content:** taxonomy, item banks, passages and benchmarks are versioned and fail closed until publication gates pass.

## Main surfaces

- `/student` — diagnostic, daily session plan, practice, reading, memory, vocabulary, progress.
- `/parent` — linked children, weekly evidence, consent/privacy workflows.
- `/teacher` — classes, join codes, assignments, intervention groups and exports.
- `/supervisor` — privacy-scoped student progress overview and individual evidence.
- `/review` — independent educator review workspace.
- `/admin/users` — managed student, teacher and supervisor credentials and assignments.
- `/admin/diagnostic-pilot` — expiring internal/feedback pilot access, agreement provenance, revocation and the global kill switch.
- `/admin` — content, diagnostic pilot, graph, item review, prompts, jobs, schools, audit and benchmark governance.

## Environments and promotion

Feature branch → `develop` staging/preview → protected PR → `main` production.

Editorial review can continue after the application is deployed. The production
content audit reports the remaining general-availability work but does not block
the deploy. Unpublished material is still unavailable to ordinary students;
only explicitly enrolled feedback participants can use the isolated provisional
diagnostic, whose evidence cannot unlock the normal learning path.

Each environment must use separate Supabase credentials and isolated PostHog, Sentry, Resend, OAuth and Vercel configuration. Run `npm run launch:verify-env`, then execute the human checks in `docs/launch-gates.md`. Never treat placeholder credentials, QA reviewers or mock content as satisfying launch acceptance.

## Important documentation

- [`docs/implementation-status.md`](./docs/implementation-status.md) — living engineering/launch status.
- [`docs/launch-gates.md`](./docs/launch-gates.md) — protected credentials and human acceptance.
- [`docs/execution-report-2026-09-01.md`](./docs/execution-report-2026-09-01.md) — latest incoming-student and release evidence.
- [`roadmap-to-production.md`](./roadmap-to-production.md) — historical sprint specification.
- [`docs/french-learning-graph-and-automated-content-roadmap.md`](./docs/french-learning-graph-and-automated-content-roadmap.md) — graph/content design history.
- [`docs/pilot/four-week-protocol.md`](./docs/pilot/four-week-protocol.md) — friendly-family rehearsal.
- [`docs/safety-checks.md`](./docs/safety-checks.md), [`docs/runbooks.md`](./docs/runbooks.md), [`docs/observability.md`](./docs/observability.md).

## License and source governance

No external lexical or curricular dataset may be imported without a recorded compatible license and commercial-use decision in `docs/french-source-register.md`. Human-authored and generated artifacts remain subject to review and benchmark governance.
