# Selective passage review — 9 September 2026

Generated passages do not all require human approval. The intended operating model is automated checks on every candidate, editorial review of exceptions, and a deterministic 5% independent review sample of passing candidates. Under the current policy introduced by migration `0138`, one favorable review unlocks editorial approval within the manual workflow. A version explicitly escalated by an editor retains its higher threshold. Existing reviews and assignments remain intact.

## Implemented path

The hourly `/api/jobs/passage-automation` worker evaluates newly generated passage candidates using real moderation, the private French grammar service, deterministic length/difficulty/answer checks, semantic duplicate detection, and an independent model. This connects to the existing passage publisher and learner library, rather than the previously unused on-demand orchestrator.

The first scope is low-risk expository passages with multiple-choice questions. New expository generation uses this format when the database automation evaluator is configured. Other formats, uncertain facts, failed checks, and service errors enter the existing editorial queue. A failing sample review withdraws the affected automated text from new sessions. An automated approval is stored as `auto_approved` / `ai_automated`, never as a human approval.

Publication requires fresh QA evidence bound to the exact candidate, matching evaluator/pipeline versions, and an enabled calibrated policy. Materialized questions and answer keys must match the evidence. Published automated text and questions cannot be edited in place. The initial pilot permits a deterministic 10% student cohort and at most 100 reading sessions per text. Existing readers retain access to their session after a cap or withdrawal; new sessions are blocked. The policy switch stops new automated publication and sessions immediately. While enabled, publication revalidates the immutable calibration, evaluator and QA versions, every configured reviewer, a sample rate of at least 5%, a cohort no larger than 10%, and an exposure cap no larger than 100. Drift fails closed even when reviewer access changes after activation.

The readiness audit no longer requires 60 human-approved passages, 60 published editorial versions, or 120 submissions. It retains a human-approved fallback passage and the separate diagnostic, benchmark, taxonomy and lexical requirements. Corpus/review counts are still reported as progress metrics.

## Historical deployment checkpoint — 9 September 2026

At this checkpoint, migration `0135_selective_passage_automation.sql` had been applied to `sigmawrite-staging` (`pwztnrirtrnicywvdbpz`) with publication disabled. The application and cron changes were deployed to https://app.trouvetaplume.com (Vercel deployment `dpl_9D2L3F4g4vSuqtk5Z97S8nbH6RrL`). Migrations 0136 and 0137 fixed service JWT compatibility and introduced QA version `selective-passage-2`. This is historical state; the current enabled V3 state is recorded below.

The real calibration uses six versions with at least one favorable human submission per version and two deliberately faulty question variants. The initial run had no service errors, no accepted cases, and no accepted negative controls. All six references used mixed question formats outside the initial MCQ-only scope; additional independent quality concerns were recorded. This does not invalidate the educators' reviews or claim that every passage is unusable. It means this reference set does not establish that the new automatic route can correctly accept its intended format.

## Historical rollout plan

1. Deploy and configure the protected job with the independent evaluator. Optional evaluator base/key overrides are `PASSAGE_QA_BASE_URL` and `PASSAGE_QA_API_KEY`.
2. Keep publication disabled while generating and independently reviewing the MCQ reference passages. This is a bounded calibration exercise, not review of every generated text.
3. Run `node --env-file=<private-environment-file> --import tsx scripts/calibrate-passage-automation.mts --record`. The script prioritizes in-scope independently reviewed references. It requires six reviewed cases, two negative controls, zero errors/false accepts, and at least one passing reference. It writes the full report to the private output path and records immutable evidence. A failed run cannot enable the policy. This is an initial pilot check, not a statistical guarantee of quality.
4. After successful calibration, set its ID and matching model/version in the policy and enable the bounded pilot. Check actual publication, student cohort access, sampling, and withdrawal against the deployed release. Expand only after inspecting real outcomes; additional formats require their own calibrated pipeline version.

There is no requirement to finish the current 60-passage queue before deploying the application or completing this work. Human reference review, exception handling and sampling continue alongside engineering and rollout.

## Verification

The focused source tests cover policy decisions, malformed model provenance, the three-choice MCQ contract, bounded enabled-policy configuration, grammar handling, launch readiness, and the protected job route. The pgTAP files cover the final one-review/V3 schema while retaining an explicit two-review escalation case, plus calibration gating, immutable evidence, service-only approval, candidate/key tampering, approval provenance, cohort/exposure limits, reviewer-access drift, adverse sample withdrawal, and rollback. Synthetic test calibration data is rolled back and is never used to enable a live policy. Current command results belong in the workstream report rather than this long-lived operating guide.

See [the deployment report](./release-selective-review-2026-09-09.md) for sample IDs, live verification and remaining work.

## Follow-up — 10 September 2026

The three samples have been corrected and saved as version 2. All three now pass automated QA, and both negative controls are rejected. Existing unopened assignment links now point to the corrected versions. Genuine independent human reviews remain pending; publication stays disabled. See [corrections and review links](./pilot/reference-corrections-2026-09-10.md).

## One-review policy — 10 September 2026

One favorable human review per reference or manual passage now suffices for editorial approval and calibration eligibility. Additional reviews continue in parallel. Explicit editorial escalations remain possible. Automated publication still requires successful calibration; this policy does not require reviewing every generated text. Migration: 0138_one_review_publication_policy.sql.

## Bounded pilot enabled — 10 September 2026

All three corrected references have JP’s favorable review. The v2 comparison failed because the generation model’s moderation fallback returned malformed JSON. V3 uses the independent evaluator model for passage moderation and records that model in its evidence. The full fresh comparison passed: six references, three accepted in-scope passages, three held out-of-scope passages, two held negative controls, zero errors and zero false accepts. Calibration: 000125a6-dc2a-41a4-8ff8-9700f6c5b923.

Migration 0139 and deployment dpl_HjEzgVyuqqZsT3DDUWwq5gys7MFX are live. The policy is enabled for a 10% student cohort, a 100-session per-text cap and 5% sampling plus exception review. The authenticated live worker returned HTTP 200 in bounded_pilot mode with an empty queue. No new automatic publication was exercised by this check; the next verification is a fresh generation through publication and learner access. Previous human-reviewed references remain in the editorial workflow.

## Read-only configuration checkpoint — 13 September 2026

The live policy remains enabled with pipeline `selective-passage-3`, evaluator `openai/gpt-5.4-mini`, calibration `000125a6-dc2a-41a4-8ff8-9700f6c5b923`, 5% sampling, a 10% cohort and a 100-session cap. This was a read-only check; no policy, reviewer, calibration, candidate or publication row was changed. Because migrations 0134–0139 are already in the live ledger, the strengthened publication-time drift checks are delivered in forward migration `0140_passage_automation_fail_closed.sql`; do not rely on reapplying a historical migration.
