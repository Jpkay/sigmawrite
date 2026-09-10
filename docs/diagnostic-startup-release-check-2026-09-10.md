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
