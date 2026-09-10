# Human content review portal

SigmaWrite’s review portal is the controlled path from an AI-generated passage
to an immutable, published text. It uses Supabase Auth, server authorization,
RLS, database workflow functions, and append-only audit entries.

## Roles and routes

- `content_reviewer` lands on `/review` and cannot enter `/admin` or read the AI
  studio/catalog tables. A reviewer sees only their own assignments, draft, and
  submitted evaluation.
- `platform_admin` uses `/admin/reviews` for progress, `/admin/reviews/assign`
  for assignment, `/admin/reviews/disagreements` for editorial resolution,
  `/admin/reviews/reviewers` for access, and `/admin/benchmarks` for gold texts.
  An admin may also participate as the required reviewer through `/review`.

## Preparing reviewers

1. Open `/admin/reviews/reviewers`.
2. The principal administrator is already prepared as the first active reviewer.
3. Enter the real name and email for Reviewer A and Reviewer B. Do not create
   invented addresses.
4. When Supabase email delivery is configured, the invite is sent. Otherwise the
   screen returns a short-lived manual activation link for private delivery.
5. The invite opens `/set-password`; the invited adult chooses a personal
   password before being redirected to the correct admin or reviewer portal.
6. Activate or deactivate access from the same screen. Deactivation takes effect
   in RLS as well as the application.

Hosted invite delivery still requires Supabase Auth SMTP or a verified email
provider. The service-role key is used only by the server action and is never
included in browser code.

Staging also contains three clearly named `QA` reviewer identities for repeatable
workflow smoke tests. Their randomly generated passwords live only in the macOS
Keychain under `sigmawrite-staging-reviewer-*-password`; they are not valid
production educators and must not be counted toward human content sign-off.

## Assigning the pilot

Open `/admin/reviews/assign`, select the principal account and at least one other independent
reviewer, then use **Sélectionner les 60** and **Auto-attribuer équitablement**.
Each selected passage is assigned to the selected reviewers. Two favorable independent reviews unlock editorial approval, even when three people are assigned. Remaining reviews continue after publication; an additional review updates agreement metrics and notifies the editor without resetting publication. Explicit requests for further evidence retain their higher threshold. Duplicate assignments
are rejected by a unique database constraint, and submitted reviews are retained.

The first immutable review snapshot is created from every candidate in
`needs_human_review`. The initial screen selects the 60 newest pilot passages;
the earlier smoke candidate remains available but unselected.

Diagnostic exercises use a separate one-owner workload. Open
`/admin/items/review`, select the active real educators, and use **Attribuer les
exercices restants**. The guarded allocator is idempotent, balances every
section across the selected reviewers, creates a varied personal queue, sends
one aggregate notification per reviewer, and writes an attributable audit
event. It never changes an existing owner. Database triggers also refuse an
auto- or human-approved learner-visible surface that duplicates another live
item for the same competency node. For MCQs, migration `0106` includes the
normalized, order-insensitive answer set; generic stems with different choices
are distinct exercises. Open responses remain unique by normalized prompt, and
choice mutations are guarded too.

## Reviewer workflow

First-time reviewers acknowledge `/review/instructions`. They then open an
assignment, read the passage and expected answers, score eight criteria on a
four-point scale, assess every question, select issue tags, and make an overall
decision. Drafts autosave and resume after reload. A final confirmation calls a
guarded database function; the resulting review and question feedback cannot be
mutated.

Reviewers never receive cross-review data. Admin comparison becomes useful only
after all required submissions have completed the passage.

## Editorial resolution and revision

Open a completed passage from `/admin/reviews`. Every resolution requires an
admin note and stores a snapshot of the submitted reviewer results. Available
actions are approve, approve with edits, send for revision, reject, or request
another review.

Edits create a new `content_review_versions` row linked to the reviewed snapshot.
The old payload and submitted reviews are preserved. Assign the new version for
fresh review. Publication is a separate admin action and creates the existing
immutable `texts`, `text_versions`, `questions`, and `question_choices` records.

## Reporting and notifications

`/admin/reviews/export` downloads UTF-8 CSV with criterion scores, decisions,
tags, question feedback, duration, agreement, resolution, and benchmark state.
In-app notifications are created for new assignments, completed reviews, and
high disagreement. Email notifications are optional and are not required for
the review workflow.

## Verification

Run:

```bash
supabase db reset
supabase test db
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

The database test contains 34 assertions covering reviewer isolation,
deactivation, anonymous denial, direct workflow-table denial, idempotent
assignment, draft and submitted immutability, agreement classification,
audited resolution, linked revision, and atomic six-benchmark lock/unlock.

On 2026-07-10 the hosted staging workflow was also exercised end to end:

- all 60 pilot snapshots were assigned to each of three QA identities in one
  180-assignment action, and each identity independently saw exactly 60;
- those temporary assignments were then removed before any pilot submission;
- a separate smoke passage was reviewed through the browser by all three QA
  identities, including instruction acknowledgement, draft restore, opposing
  decisions, immutable submission, and hidden cross-review feedback;
- the admin comparison classified the result as `high_disagreement` (average
  2.67, spread 3), displayed every rating and comment, recorded an audited
  resolution, and created a linked second version while preserving version 1;
- both smoke versions were retired afterward. The live pilot state is exactly
  60 `needs_human_review` candidates and 60 `ready_for_review` snapshots with no
  fake completed reviews.

## Student previews in review

Exercise queues show one exercise at a time, with the same `ExerciseSurface` controls as student practice. Answers and feedback stay hidden until the reviewer checks an attempt or opens the correction. Preview checks use the shared practice grader through an authenticated, read-only action; they do not create student sessions, attempts, XP, or mastery updates. Open reading questions expose the correction rubric without pretending to grade free text automatically.

The explicit exercise editor saves pending prompts, existing choices, answer keys, and choice feedback atomically. Saving does not approve the exercise. Apply `0128_review_exercise_editor.sql` to the deployment database before releasing the editor. The RPC checks active reviewer assignments, preserves choice IDs, requires one correct choice, and retains existing published-content protections. Approval and rejection submit immediately and automatically open the next pending exercise, including across batches. Expected database failures return readable messages without advancing the queue. Migration `0129_fix_authenticated_review_approval.sql` lets the approval trigger invoke its private normalizer while preserving duplicate checks and existing user permissions. Queue position is retained in the current browser tab; unfinished editor changes should be saved before leaving the page.

Reading reviews render formatted passages and interactive questions. Dictation reviews load private signed audio URLs on demand, provide segment writing controls, and reveal the transcript separately. Audio must have been generated before it can be previewed; opening a preview never generates audio.

For local verification, apply `scripts/fixtures/review-browser.sql` only to local Supabase, run the app against that local instance, then run `E2E_REVIEW_PREVIEW=true npx playwright test e2e/review-preview.spec.ts`. The editor permission and atomicity checks are in `supabase/tests/0128_review_exercise_editor_test.sql` and roll back their fixtures.

After that preview test has completed its two synthetic decisions, run `E2E_REVIEW_DECISIONS=true npx playwright test e2e/review-decisions.spec.ts --workers=1` against local Supabase on port 55322. It resets its own 27 synthetic exercises and verifies automatic advancement from both the first and second batch, readable duplicate errors, and persisted approval/rejection counts. The authenticated approval regression is `supabase/tests/0129_authenticated_review_approval_test.sql`; it switches to the authenticated role so owner privileges cannot mask trigger permission failures.

Answer choices use a shared, answer-independent seeded shuffle in review previews, diagnostic questions, practice, and reading questions. The order remains stable during attempts, retries, and correction; IDs and original reading-choice indices remain the grading keys. Reading previews and student reading screens use the same content seed, including the options so repeated generic prompts do not share an ordering pattern. Justification rules are shuffled separately. This is presentation-only and requires no database migration.

The 2026-09-06 read-only audit found 391 of 415 active diagnostic MCQs stored the correct answer first. With presentation shuffling, the 346 three-choice exercises distribute their correct answers 118/111/117 across positions; the 46 four-choice exercises distribute 10/12/12/12; the 23 two-choice exercises distribute 12/11. Regression coverage is in `src/lib/content/choice-order.test.ts` and the review preview browser test.

For the three `construction_phrase_canonique` controlled-production exercises, a terminal full stop is optional because the target is word order. Migration `0130_word_order_optional_final_period.sql` adds the exact period-free answers to the existing alternatives and clarifies their instructions, only for the known unchanged pending items outside published/withdrawn banks. The full-sentence answer keys remain intact; punctuation is not globally ignored. Local authoring and the canonical bank artifact include the same alternatives. Regression checks exercise both diagnostic validation and the shared review/practice grader.

The shared validator now implements the final-period rule across review previews, student practice, and adaptive diagnostics, including newly authored items. Each server action supplies the competency key, prompt, instructions, modality, and response type from the database. For non-punctuation targets, an otherwise incorrect answer is checked again with only one final full stop appended. Exact matches, regex validation, and grammar-service validation use the same policy; original answer text remains unchanged. Other punctuation, spelling, accents, and word order are not normalized away.

Punctuation/quotation/abbreviation tasks, explicit punctuation instructions, and dictation stay strict. The old generic sentence-writing instruction alone does not turn punctuation into the assessed skill. Authors can require strict grading with `validatorConfig.punctuationPolicy: "strict"`; `"optional_final_period"` explicitly opts in for an incidental final full stop, but cannot override recognized punctuation targets or dictation. Missing assessment context or an unknown policy remains strict. The rule does not change multiple-choice scoring or replace rubric-based assessment.

Validation: `assessment-policy.test.ts` covers new competency keys, ordering tokens without a full stop, preview/practice/diagnostic parity, regex and grammar-service paths, explicit strict policies, and negative punctuation/spelling controls. A read-only audit verified 134 valid sentence answers from the live bank: all pass without their incidental final full stop under the shared rule, including 115 that previously failed. No answer-key backfill or database migration is needed for this policy.

Reading exercise presentation separates the authored `Lis le texte.` instruction, passage paragraphs, and final question into labeled regions. `ExercisePrompt` is shared by review/practice controls and the student diagnostic. Original paragraph breaks are preserved, including in other multiline prompts; unstructured text is left intact rather than split by guessed sentence boundaries. No content migration or answer-key change is needed.

Written reading comprehension uses reviewer-authored meaning criteria (`validator_config.readingRubric`, version 1). Every required idea must be expressed; equivalent wording, clear references to the prompt, and harmless spelling or punctuation differences are accepted. Approved `correct_answer` and `acceptable_answers` remain an offline fast path. Other formulations go through the shared `validateAnswer` entry point used by review previews, practice and diagnostics. Grammar, conjugation and spelling exercises retain their existing validators.

All 15 locally authored written reading exercises now include required ideas and an additional accepted formulation; migration 0131 backfills matching live items while preserving review decisions. The editor exposes “Autres réponses acceptées” and “Idées attendues”. Listed answers should satisfy the entire rubric. Reviewer saves use the same pending-item, role and assignment checks as the existing editor, and save all content atomically. The displayed correction is labeled as an example.

Semantic evaluation uses the configured AI endpoint. On OpenRouter, the interactive grading model defaults to `openai/gpt-5.4-mini`; `READING_GRADING_MODEL` can override it. Other endpoints retain their configured model. The evaluator receives only the exercise, authored criteria and answer, without student or account identifiers. It returns one decision and a verbatim supporting answer excerpt per criterion. Missing criteria produce authored feedback, and contradictions prevent a pass. Invalid responses, unavailable service and uncertainty abort grading before an attempt is recorded; they never become an incorrect answer. Listed answers remain available during outages. This is probabilistic meaning assessment, so reviewer checks remain important.

Run the deterministic tests with `npm test`. To verify real unlisted paraphrases and counterexamples against the configured provider without creating student attempts, run `DOTENV_CONFIG_PATH=.env.local npx tsx scripts/verify-reading-grading.mts --live`. The corpus includes the reported answer, negations, missing ideas, reversed viewpoints, copied text and instruction-injection attempts. It is opt-in to avoid network calls in CI. Existing published bank artifacts remain immutable; regenerate new draft banks with the updated authoring code.

Interest-aware practice now reads the student's declared interests and prefers matching `validator_config.interestKeys` among exercises with comparable predicted difficulty (three-percentage-point bands). Skill selection remains fixed by the current node; in-zone items outrank out-of-zone matches. Response-type variety cannot jump outside the preferred difficulty zone. The diagnostic selector does not use interests.

Migration 0133 tags existing reading passages and adds 30 **pending** practice drafts spanning football, music, gaming, animals, space and cooking, across five written-comprehension skills. All scenarios explicitly identify themselves as fiction. Review them at `/admin/items/themes`; normal approval makes them eligible for student practice. They have no diagnostic membership. The source and repeatable migration builder live in `interest-reading-items.ts` and `scripts/build-interest-reading-migration.mts`. Interests without matching approved material fall back to suitable reviewed exercises.

Language coaching is separate from correctness, score, mastery and XP. After a correct reading-practice answer, every fourth distinct successful exercise can receive one optional automatic spelling/grammar tip; retries on the same session position do not increase that count. “Améliorer ma phrase” requests one useful spelling, grammar or clarity suggestion at any time after success. Review previews offer the same requested help. Incorrect answers receive comprehension guidance first. An adequate sentence can receive no suggestion. The coach prioritises recurring errors from up to three previous answers and does not penalise a missing final period. A provider outage never removes an earned success or blocks continuing.

Migration 0132 stores per-attempt coaching results with service-only access, student ownership checked by the action, and deletion cascading from attempts/students. Cached results prevent a repeated help request from producing a new rewrite each time. Coaching data is included in student exports. No coaching is added to the diagnostic flow. The semantic grader explicitly checks actor/action attribution, including the distinction between those digitising a document and researchers later using it.

Live smoke checks: `DOTENV_CONFIG_PATH=.env.local npx tsx scripts/verify-reading-coaching.mts --live`; the grading corpus also includes actor-swapping counterexamples.

## Two-review policy rollout — 9 September 2026

Migration `0134_two_review_publication_policy.sql` was tested in a rolled-back staging transaction, then applied and recorded in the migration ledger of `sigmawrite-staging` (`pwztnrirtrnicywvdbpz`), the database holding the current review queue. All 60 active passage versions now require two reviews: six are `review_complete`, 54 are `in_review`, and all 150 outstanding assignments are preserved. No passage was editorially approved or published by the migration. The separate production database has not been migrated in this task.

Verification: 16 behavioral database assertions, 781 unit tests, TypeScript, ESLint, and the production Webpack build pass. Assignment-screen defaults and progress wording are updated in source and take effect on the next application deployment.

## Selective automation — 9 September 2026

The one-review threshold applies to the manual editorial queue. It is not a requirement for every generated passage. The implemented automated route uses independent QA, exception review and a 5% sample, with separate automated provenance and bounded learner exposure. Its database migration is applied with publication disabled; the application deployment and successful in-scope calibration remain pending. See [selective passage automation](./selective-passage-automation.md) for the exact state and rollout steps.

Deployment follow-up: the selective-review workflow is live on https://app.trouvetaplume.com with QA v2 in shadow mode, three generated reference samples, 791 passing tests and zero audited dependency vulnerabilities. Automatic publication is still disabled pending successful calibration. See [release report](./release-selective-review-2026-09-09.md).

## One-review policy — 10 September 2026

One favorable human review per reference or manual passage now suffices for editorial approval and calibration eligibility. Additional reviews continue in parallel. Explicit editorial escalations remain possible. Automated publication still requires successful calibration; this policy does not require reviewing every generated text. Migration: 0138_one_review_publication_policy.sql.
