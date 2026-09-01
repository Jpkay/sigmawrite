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
- Service-only, actor-derived audit logging; comprehensive fail-closed guardian exports; leased crash recovery for jobs and multi-stage completion claims.
- Explicit-only, HMAC/session-pseudonymous analytics with identifiers, free text, autocapture and recordings removed.
- Twelve-character password floor, adult signup confirmation state, student accessibility/security settings and bilingual parent privacy/security flows.
- Guarded/resumable pilot generation, fail-closed duplicate QA and pedagogy-derived generation contracts.
- Typed vocabulary production recall, vocabulary-aware reading tie-breaking, lexical launch thresholds and required corrective retests.
- Seeded authenticated browser projects for student, parent and teacher pilot routes; safe prebuild/migrate/deploy/smoke workflow.

## Validation evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 96 files, 556 tests passed.
- `npm run build`: passed; 62 routes generated.
- `npm run test:e2e`: 15 public Chromium checks passed locally; three isolated-Supabase authenticated journeys are committed and intentionally skip without `E2E_AUTHENTICATED=true`.
- `npm run security:audit`: zero vulnerabilities.
- `supabase test db`: could not run locally because the local Docker/Supabase service was unavailable and timed out during startup. CI is configured to run the complete SQL directory against a fresh database. Migrations 0077–0086 therefore still require fresh-database and staging runtime evidence.

## Staging gate update (2026-08-06)

- Isolated staging is migrated through requested migration `0086`, plus corrective authorization migration `0087`. The 46-file pgTAP suite has been exercised remotely and staging-sensitive fixtures corrected; the final all-directory rerun is still pending because the remote runner stalls after pooler connection, and Docker Desktop remains unavailable for a fresh local run.
- Lexique 4.00 is rights-recorded and published as `sigma-french-lexique4@4.00.1`: 2,005 lemmas, 19,374 forms and 98.08% held-out coverage.
- Hosted Auth now enforces a 12-character password minimum, leaked-password protection, email confirmation, explicit native rate limits and exact redirect restrictions.
- Turnstile client-token integration and a managed widget for the staging hostname are configured, with the public key protected in Vercel. A fresh Supabase Auth dashboard load confirms native CAPTCHA is enabled with Cloudflare Turnstile and the matching secret persisted. Deployment `dpl_8sBhba2xPPzd2MehVannC6aK6wLR` reached Ready at `https://sigmawrite.vercel.app`; clean-browser adult signup and password-recovery requests both obtained managed tokens and were accepted by Supabase without CAPTCHA errors.
- Privacy-safe EU PostHog is configured with autocapture, heatmaps and replay disabled. Protected PostHog, Turnstile and restricted Resend staging variables are installed in Vercel Preview and Production.
- Sentry project `sigmawrite-staging` is connected to GitHub, origin-restricted and configured with protected Preview/Production variables and a narrow build token. Runtime verification awaits a deployment and controlled test error.
- The unrelated Google project `scale-inc-chatbot` was scheduled for deletion, but Google still counts it during the 30-day recovery window; Google OAuth remains quota-blocked. Resend still needs a SigmaWrite-owned sender domain and hosted LanguageTool remains undefined.
- See [`staging-service-evidence-2026-08-06.md`](./staging-service-evidence-2026-08-06.md) for sanitized evidence and remaining credential blockers.

## Remaining external/human gates

Do not mark any of these complete from source control:

1. Trigger a controlled Sentry test error; obtain Google Cloud project quota for adult OAuth; verify a SigmaWrite-owned Resend sender domain; and provision hosted LanguageTool.
2. Create a separate protected production Vercel target and populate environment-specific secrets; re-authenticate GitHub CLI to configure protected GitHub environments.
3. Complete independent review by three real educators; resolve/publish the launch diagnostic and passage set and lock exactly six benchmark passages.
4. Complete the friendly-family rehearsal without manual database intervention and close all P0/P1 findings.
5. Obtain controller/legal approval for the minors-first policy, consent authority, subprocessors, hosting region/transfers and retention.
6. Promote through protected `develop` → `main` CI and verify real production telemetry, email delivery, auth recovery, jobs and rollback.

The persistent execution goal remains open until these gates produce real evidence.
