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
