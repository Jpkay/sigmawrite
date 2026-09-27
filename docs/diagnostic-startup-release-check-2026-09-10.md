# Diagnostic startup release check — 10 September 2026

**Current status: activated.** Both required releases are published and live
readiness is true. Earlier findings below are retained as history.

The student profile saves successfully. Regular diagnostic startup fails because
`french-taxonomy-v2` is still `validating` and `french-diagnostic-bank-v2` is still
`draft`. The published v3 taxonomy is not the taxonomy pinned by this diagnostic.

## Verified

- Current local canonical-bank verification passes in partial publication mode:
  696 total questions, 265 eligible, 431 pending and excluded from serving.
- All four sections meet the current automated readiness requirements.
- 27 item-bank, protocol, and learning-path tests pass.
- Live database readiness agrees on the section minimums; overall readiness is
  false because the pinned taxonomy has not been published.
- The error-handling fix returns expected unavailability as data, preserves the
  profile, and offers retry. A browser check with controlled Server Action
  responses verified the explanation and one additional request on retry.
- ESLint and TypeScript pass for the application change.

## Remaining release evidence

The older review documents still require all items to be reviewed. Migration
0124 and the current verifier support partial publication, so completing all
431 pending questions is not a prerequisite for serving the eligible subset.
However, the review records have no approved checksum. The taxonomy review also
requires a review of provisional grade/CEFR mappings for the intended population;
the bank review requires human-confirmed passage/context diversity where the
pinned evidence requires distinct texts. This check does not supply or fabricate
those approvals.

Before publishing, record the outstanding review evidence, reconcile the release
review documents with partial publication, bind approval to the freshly verified
manifest, then publish the pinned taxonomy and eligible bank through the existing
publication guards. Validate a signed-in student's first question and answer;
HTTP availability alone is insufficient.

No taxonomy, question-bank status, item approval, or pilot enrollment was changed.

Verified local manifest checksum: `sha256:839600ee7d7891811ebaae184eb8808306a11b7d002c51d3fe16091537da316a`.


## Activation authorized and completed

The user explicitly instructed: “resolve the pending approval and activate the
diagnostic.” The release records now bind this operational authorization to the
verified taxonomy and partial-bank checksums. This is not an additional human
review attestation for items or provisional placement mappings.

A fresh export from the live database reproduces the verified bank checksum.
The publication transaction passed with all database guards enabled in a rolled-
back trial, then was committed. The taxonomy and bank are now published, and
live overall readiness is true. No item review status or pilot access changed.

Live browser smoke test: a temporary regular (non-pilot) grade-8 student selected
mangas, animés, and drawing, saved onboarding, loaded question 1, submitted an
answer, and reached question 2. The database confirmed the selected interests
and an ordinary running diagnostic. One earlier smoke attempt timed out after
submission; a fresh run passed. This check does not claim completion of the full
adaptive diagnostic. Synthetic test data is removed after each test.

## Full live diagnostic check — 10 September 2026

**Outcome: completion verified; reliability checks failed.** A temporary regular
(non-pilot) grade-8 student completed all 48 questions on
`app.trouvetaplume.com`, with 12 answers in each of the four sections. The live
page displayed “Ton parcours est prêt”, the outcome counts, and the first five
learning-path steps. The database independently confirmed a completed run, all
four sections completed, and one active learning path containing 161 steps.

This was an automated workflow check using synthetic answers (first displayed
multiple-choice option, or “Je ne sais pas.” for written answers), not a check of
placement accuracy or a real student's level. The completed run needed one retry
on its first written answer. Two earlier runs repeatedly failed on written
question six with HTTP 500 and digest `1468027376`; those failures remain
unresolved. A separate local call using the current production grading settings
successfully graded the same test answer, so that check did not establish the
cause of the live failures.

Reloading the completed results page failed the persistence-of-display check:
the original completed run and learning path remained stored, but startup created
a new, zero-answer re-entry diagnostic with reason `high_uncertainty`. The page
therefore returned to questions instead of showing the completed results.
Navigation from results to the learning dashboard was not reached because this
reload assertion failed. These findings do not support calling the complete
student flow reliable yet.

Evidence captured locally:
- `/private/tmp/diagnostic-full-78fd9602-results.png`
- `/private/tmp/diagnostic-full-78fd9602-results.txt`
- `/private/tmp/diagnostic-full-78fd9602-database.json`
- `/private/tmp/diagnostic-full-78fd9602-reload-runs.json`
- `/private/tmp/diagnostic-full-fb21b1a2-failure.png`

The first automation attempt also had a test synchronization error (answering
before the previous question's transition finished); it was corrected before the
subsequent runs. All four synthetic accounts and their temporary school/class
fixtures were removed. No application change or deployment was made during this
verification.

## Fixes deployed and verified

The Vercel request logs identified the written-answer failures precisely:
`ReadingAssessmentError`'s previous generic-error path was reached because the
provider returned `uncertain=true` for the synthetic answer “Je ne sais pas.”
Explicit, complete admissions of not knowing are now graded deterministically as
not demonstrating the skill. Substantive answers still use the reading rubric;
the prompt distinguishes an incorrect answer from genuine grading uncertainty.
Expected grading failures now return a submission message without losing the
student's text or fabricating a grade.

Ordinary diagnostic visits now load the persisted completed report and path
without rerunning finalization or creating a new assessment. The existing
“Mettre à jour” action explicitly requests reassessment; its URL retains that
intent while a reassessment is running and clears it when results are reached.

Code commit: `cd899c8` on develop; production release cherry-pick `a6477b6`.
Deployment: `dpl_AioWN6jw3P4d3CRYEekcj2ivS87n`.

Verification:
- TypeScript and targeted ESLint checks pass.
- 32 focused tests pass, covering saved-result reads, explicit non-answers,
  substantive answers, uncertain/malformed judgments, and section stopping rules.
- A genuine paraphrase about mangrove roots was accepted by the configured
  production grader in a direct grading check.
- A fresh regular grade-8 account completed 48 live questions (12 per section)
  with **zero server errors and zero retries**, then saw final results and one
  active path with 161 steps.
- Refresh displayed the saved results; the database still contained exactly the
  same single completed run.
- “Commencer mon parcours” opened the learning dashboard and its daily activity
  plan. Revisiting `/student/diagnostic` again displayed the completed results.
- The synthetic account and its temporary fixtures were removed.

Evidence:
- `/private/tmp/diagnostic-fixed-19fa4ef1-evidence.json`
- `/private/tmp/diagnostic-fixed-19fa4ef1-results.png`
- `/private/tmp/diagnostic-fixed-19fa4ef1-dashboard.png`
