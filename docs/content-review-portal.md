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
  An admin may also participate as one of the three reviewers through `/review`.

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

Open `/admin/reviews/assign`, select the principal account and both invited
reviewers, then use **Sélectionner les 60** and **Auto-attribuer équitablement**.
Each selected passage is assigned to all three reviewers. Duplicate assignments
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
