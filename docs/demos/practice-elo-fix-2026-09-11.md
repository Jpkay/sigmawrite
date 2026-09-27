# Exercise submission: published-item Elo update

The Doves synthetic demonstration completed 48 diagnostic responses successfully.
A subsequent practice answer was graded and inserted, but feedback failed with a
production React server error. The post-answer item Elo update was rejected by
`guard_published_diagnostic_item_content`: migration 0076 added difficulty_rating
and rating_attempts after migration 0059 defined its operational-field whitelist.

Migration 0145 permits precisely those two additional operational columns. Prompt,
answer, validator, review and membership protections are preserved.

Validation:
- Fresh full-schema PostgreSQL regression passed for published and withdrawn bank
  memberships: rating changes allowed; answer, prompt, validator, mixed rating and
  answer changes, item deletion and answer-choice changes rejected.
- Applied only 0145 to production pwztnrirtrnicywvdbpz and recorded it in migration
  history atomically. Pending granular migrations 0141–0144 were not applied.
- Production transaction exercised the affected published item: rating updates
  succeeded, a sentinel answer edit was rejected, then all test changes rolled back.
- No application deployment and no browser manipulation during the presentation.
  Fresh end-to-end exercise submission after the fix remains to verify.

The original successful practice attempt remains recorded; do not replay it as a
new answer when repairing the session. Submission idempotency across post-write
failures needs a separate follow-up.
