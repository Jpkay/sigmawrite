# Repair learning permissions after granular diagnosis

The deployed browser could display an older reading passage but could not start its session for a student who had completed the granular diagnostic. The same failure occurred on both the candidate and existing public deployment. The authenticated `student_learning_is_unlocked` call returned true, but no reading session was inserted.

Inspection of live `pg_policies` found 18 policies still bound to `student_legacy_learning_is_unlocked`. Migration 0142 renamed the original function and created a combined readiness function with its former name. PostgreSQL preserved the original function identity in existing policies, leaving those policies on the legacy-only predicate. Application checks and RLS therefore disagreed.

Migration `20260912120000_granular_learning_policy_bindings.sql` changes only those reviewed policy expressions to call the combined predicate. Ownership checks, commands, policy roles and permissive/restrictive attributes remain unchanged. It covers reading sessions and answers, reading events, skill estimates, retrieval cards and schedules, reading estimates, competency attempts, package progress, learning retrieval schedules, quizzes and word mastery. Any unexpected policy still using the legacy-only predicate causes the transaction to fail rather than silently changing unreviewed access rules.

A disposable PostgreSQL 17 test reproduced denial before the migration, then verified legacy and granular ownership-based access, rejection of an unassessed student, rejection of ownership transfer and cross-student answer/schedule writes. All 18 policy expressions were compared against the original snapshots; only the predicate name changed. Applying the migration twice passed.

The migration was applied to the linked production database. A subsequent catalogue query confirmed zero remaining legacy-only policy bindings. The candidate browser then created a real reading session for the existing capture QA student, where the earlier attempts had failed. Full reading completion verification is recorded separately in the rollout report.

No student results, onboarding flags, mastery records or exposure-completeness claims were fabricated. Eligibility continues to come from the existing published-diagnostic readiness functions.
