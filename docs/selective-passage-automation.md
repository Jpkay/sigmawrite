# Selective passage review — 9 September 2026

Generated passages do not all require human approval. The intended operating model is automated checks on every candidate, editorial review of exceptions, and a deterministic 5% independent review sample of passing candidates. Two favorable reviews still unlock editorial approval within the manual workflow. Existing reviews and assignments remain intact.

## Implemented path

The hourly `/api/jobs/passage-automation` worker evaluates newly generated passage candidates using real moderation, the private French grammar service, deterministic length/difficulty/answer checks, semantic duplicate detection, and an independent model. This connects to the existing passage publisher and learner library, rather than the previously unused on-demand orchestrator.

The first scope is low-risk expository passages with multiple-choice questions. New expository generation uses this format when the database automation evaluator is configured. Other formats, uncertain facts, failed checks, and service errors enter the existing editorial queue. A failing sample review withdraws the affected automated text from new sessions. An automated approval is stored as `auto_approved` / `ai_automated`, never as a human approval.

Publication requires fresh QA evidence bound to the exact candidate, matching evaluator/pipeline versions, and an enabled calibrated policy. Materialized questions and answer keys must match the evidence. Published automated text and questions cannot be edited in place. The initial pilot permits a deterministic 10% student cohort and at most 100 reading sessions per text. Existing readers retain access to their session after a cap or withdrawal; new sessions are blocked. The policy switch stops new automated publication and sessions immediately.

The readiness audit no longer requires 60 human-approved passages, 60 published editorial versions, or 120 submissions. It retains a human-approved fallback passage and the separate diagnostic, benchmark, taxonomy and lexical requirements. Corpus/review counts are still reported as progress metrics.

## Deployment state

Migration `0135_selective_passage_automation.sql` is applied and recorded on `sigmawrite-staging` (`pwztnrirtrnicywvdbpz`), the database containing the current reviews and used by the existing Vercel app. The separate production database was not changed. The shadow policy is configured with the independent evaluator and the existing JP/Astrid/Alice review team. Automatic publication remains disabled. Application and cron changes are now deployed to https://app.trouvetaplume.com (Vercel deployment `dpl_9D2L3F4g4vSuqtk5Z97S8nbH6RrL`). Migrations 0136 and 0137 fix service JWT compatibility and introduce QA version `selective-passage-2`. No candidate was bulk-approved or published.

The real calibration uses six versions with at least two favorable independent human submissions and two deliberately faulty question variants. The initial run had no service errors, no accepted cases, and no accepted negative controls. All six references used mixed question formats outside the initial MCQ-only scope; additional independent quality concerns were recorded. This does not invalidate the educators' reviews or claim that every passage is unusable. It means this reference set does not establish that the new automatic route can correctly accept its intended format.

## Remaining rollout steps

1. Deployment and evaluator configuration are complete. The protected live job rejects unauthorized requests and processes candidates successfully in shadow mode. The evaluator is `openai/gpt-5.4-mini`. Optional evaluator base/key overrides are `PASSAGE_QA_BASE_URL` and `PASSAGE_QA_API_KEY`.
2. The current review database already has the evaluator and reviewer team configured. Keep `enabled=false`; verify equivalent configuration if deploying to another database. New generations are checked in shadow mode. Three MCQ reference passages have been generated and assigned to the existing review team; inspect their QA reports and correct systematic defects in the generator/checker, preserving all existing independent reviews. This is a bounded calibration exercise, not review of every generated text.
3. Run `node --env-file=<private-environment-file> --import tsx scripts/calibrate-passage-automation.mts --record`. The script prioritizes in-scope independently reviewed references. It requires six reviewed cases, two negative controls, zero errors/false accepts, and at least one passing reference. It writes the full report to the private output path and records immutable evidence. A failed run cannot enable the policy. This is an initial pilot check, not a statistical guarantee of quality.
4. After successful calibration, set its ID and matching model/version in the policy and enable the bounded pilot. Check actual publication, student cohort access, sampling, and withdrawal against the deployed release. Expand only after inspecting real outcomes; additional formats require their own calibrated pipeline version.

There is no requirement to finish the current 60-passage queue before deploying the application or completing this work. Human reference review, exception handling and sampling continue alongside engineering and rollout.

## Verification

791 unit tests, TypeScript, ESLint and the production Webpack build pass. The publication migration passes 20 behavioral database assertions inside a rolled-back transaction, covering disabled defaults, calibration gating, distinct reviewers, immutable evidence, service-only approval, candidate/key tampering, approval provenance, exposure caps, adverse sample withdrawal and rollback. The follow-up migrations pass nine further assertions for modern JWT authorization, retained idempotency and disabled QA upgrades. Dependency audit: zero vulnerabilities. Synthetic test calibration data was rolled back and was not used to enable the policy.

See [the deployment report](./release-selective-review-2026-09-09.md) for sample IDs, live verification and remaining work.
