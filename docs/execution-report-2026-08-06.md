# Execution report — staging hardening sprint

Date: 2026-08-06  
Branch: `develop`

## Outcome

All repository-actionable launch hardening identified in this sprint has been implemented and committed. SigmaWrite is ready for an **isolated staging migration and human pilot acceptance**, not for an unsupported public production claim.

## Delivered

- Authorization/RLS hardening, role-source correction, safe redirects and high-entropy class codes.
- Public-asset-only service-worker caching, sign-out cache erasure and complete password recovery.
- Idempotent scheduled jobs, report/notice business keys, atomic deletion claiming and job failure alerting.
- CSV formula neutralization and fail-closed teacher report exports.
- Next.js 16.3 dependency upgrade with zero known npm vulnerabilities.
- CI application/build/audit gates, complete SQL test discovery and Playwright/axe browser coverage.
- Privacy/terms, launch environment validation, monitoring schedule and operational documentation.
- Flat FSRS vocabulary-memory practice.
- Persistent adaptive scaffolds, worked examples, fading after unaided success and graph-directed remediation.
- Live deterministic conjugation and LanguageTool agreement checks.
- Durable at-most-once claims for reading completion and reviewed-content publication; content remains draft until every dependent record is ready. These workflows intentionally fail closed for operator repair after an interrupted claim because an external AI/embedding call cannot participate in one Postgres transaction.
- Parent-mediated child password rotation with guardian-link reauthorization and audit logging.
- Consolidated implementation status and living roadmap.

## Validation evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 92 files, 544 tests passed.
- `npm run build`: passed; 62 routes generated.
- `npm run test:e2e`: 15 Chromium checks passed.
- `npm run security:audit`: zero vulnerabilities.
- `supabase test db`: could not run locally because the local Docker/Supabase service was unavailable and timed out during startup. CI is configured to run the complete SQL directory against a fresh database. Migrations 0077–0082 therefore still require staging runtime evidence.

## Irreducible external/human gates

Do not mark any of these complete from source control:

1. Apply migrations through 0082 to isolated staging and pass all pgTAP tests.
2. Supply and test protected Vercel/Supabase, PostHog, Sentry, Resend, Google adult OAuth and LanguageTool configuration.
3. Complete independent review by three real educators; resolve/publish the launch diagnostic and passage set and lock exactly six benchmark passages.
4. Complete the friendly-family rehearsal without manual database intervention and close all P0/P1 findings.
5. Obtain controller/legal approval for the minors-first policy, consent authority, subprocessors, hosting region/transfers and retention.
6. Promote through protected `develop` → `main` CI and verify real production telemetry, email delivery, auth recovery, jobs and rollback.

The persistent execution goal remains open until these gates produce real evidence.
