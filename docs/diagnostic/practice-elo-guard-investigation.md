# Practice submission failure after answer persistence

Investigated 2026-09-11, production reads only. No attempt replay or production
schema/data change. Local fix candidate: `practice-elo-guard-fix.sql`.

## Observations

The synthetic doves.demo practice attempt at 06:38:39 UTC was accepted and stored.
The direct estimate, mastery occurrence and scaffold success streak were updated.
The learner's Elo row was also updated at the same time with one attempt. The
practice item's Elo columns remained null/zero with an older update timestamp.
The item belongs to a published diagnostic bank.

`submitNodePractice` performs these steps sequentially. `updateEloRatings` first
updates the learner, then updates the item, and throws on item update failure.
Migration 0059 freezes published-item content with a whitelist for operational
psychometrics. Migration 0076 subsequently added `difficulty_rating` and
`rating_attempts` without extending that whitelist. The local guard therefore
rejects exactly the update that failed to persist.

This is strong state-and-code evidence for the failure, rather than a captured
server exception. Current production function text was not available through the
read-only REST interface. The attempted Vercel logs command ended with a deployment
lookup failure; it did not capture the exception.

## Fix and verification still needed

Permit precisely the two operational Elo columns in the existing guard. Preserve
all other immutability checks. Validate on a disposable database with a published
bank member: updating Elo columns succeeds; editing the answer or prompt still
fails, including an update that combines Elo and content edits. A withdrawn bank
must retain the same protections. Then verify a full practice submission once
through feedback and the next exercise.

The action is currently non-atomic: learner and answer changes survived the error.
Do not replay the demonstration attempt to test the fix: that would double-count
mastery and learner Elo. Retry/idempotency and atomic persistence are a separate
required follow-up to prevent partial writes from future failures.

## Implemented and locally verified

Migration `supabase/migrations/0145_allow_published_item_elo_updates.sql` extends
only the two-column operational whitelist. The isolated PostgreSQL full-schema
runner applied all 144 migration files (through sequence 0145) and passed on 2026-09-11:

`sh scripts/testing/granular-full-schema-db.sh`

The actual trigger test in `scripts/testing/sql/published-item-elo-test.sql` uses
a published synthetic bank membership. Elo updates persist while correct-answer,
prompt, validator, mixed Elo/content, item deletion, choice text, choice answer-key
and choice deletion updates fail. The same assertions pass after withdrawing the
bank. Test data are rolled back and the disposable cluster is removed. No production
changes were made by this implementation task.
