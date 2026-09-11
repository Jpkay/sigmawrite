# Existing students and expanded releases

The current runtime always resumes the latest saved session against its pinned release. This correctly protects in-progress diagnostics, but a completed student can remain on an older learning scope indefinitely when new content is published. Full progressive coverage therefore needs a separate, explicit completed-session upgrade path; increasing the default scope alone is insufficient.

A read-only production comparison of v9 (`e7566a20-2a96-4b7a-85fa-cb8883ab39a9`) and v10 (`ca9e03ae-0bae-496b-aeb0-26a5b68f75c0`) verified both published bundle checksums. The taxonomy, existing skills, source bank items, probes including pool assignments, teaching and activities are unchanged. The new supported targets are coordination recognition/controlled production and passive recognition/controlled production. No session was modified.

`inspectLearningReleaseCompatibility` now provides a conservative content preflight. It rejects changed or removed old skills, questions, probes, lessons, activities, taxonomy/facet identities or previously supported assessment scope. It reports new scope targets. It is not an authorization check: callers must still validate live publication, parent releases and the exact serving permission. Four focused tests cover unchanged content, answer/graph/pool changes, expanded versus reduced scope, and changed teaching or activity destinations. TypeScript and source lint passed before the final additional teaching test; that test also passed. The function is not yet wired into runtime transfers.

The transfer implementation must:

1. Only accept a completed session with no active lesson or independent check. Keep an unfinished assessment on its original release.
2. Create a successor learning session rather than rewriting the original release binding or historical evidence. Keep unsupported/new targets unknown.
3. Atomically lock the source revision, create one successor and prevent later stale commands from modifying the old session. Select the successor consistently instead of relying on most-recent update time alone.
4. Preserve answer provenance. Multiple-choice and support-choice IDs are derived from the original session ID; copying them to a new session without recording that origin would break answer review.
5. Preserve original observation receipts, global material history and validated lesson completions. Never convert guided responses into independent evidence or reset exposure history.
6. Verify repeated upgrades, concurrent learning commands, changed/withdrawn releases, failed persistence, review of old answers, new activities and reload against the real schema before activation.

No upgrade, reset, migration or new learner assessment was performed by this audit. The full v10 QA journey remains separate and running. The initial-diagnostic discrimination shortfalls remain open; this work addresses access to later coverage, not those initial sampling failures.

## Evidence-preserving preparation implemented

`prepareLearningSuccessor` now prepares a separate learning state only for an idle completed assessment with a matching original release binding and compatible content. It retains observations, refinements, exposure history, elapsed time, lesson completions and historical missing answers. It resets only the new row's optimistic revision and stores its immediate predecessor reference. It rejects unknown historical probes or lesson completions. The old state is not mutated. Actual live authorization, row locking and persistence are intentionally outside this pure function and remain to implement.

Retained responses now carry an optional `sourceSessionId`; review resolves answer and supporting-passage choice IDs using that origin. Repeated upgrades retain the first answer origin instead of overwriting it. Tests verify source immutability, evidence/time/exposure preservation, original choice resolution, repeated-origin preservation, incompatible releases and unfinished/busy sessions. All 522 granular tests across 150 files, TypeScript and scoped ESLint pass. No production transfer has been enabled or performed.

## Atomic persistence preparation

Migration 0150 adds a server-only transaction that creates one learning successor
from an idle, completed session. It locks the predecessor revision, rejects
historical-state changes, preserves answer origins, and makes the predecessor
read-only after linking. An active-session view excludes superseded rows while
historical session lookup remains available.

The disposable full-schema PostgreSQL test covers cross-student rejection,
stale revisions, historical answer/evidence preservation, rollback after rejected
input, idempotent retries, active-session selection, and rejection of writes to
the predecessor. Browser roles cannot call the successor function. These are
storage-integrity checks with synthetic fixtures, not pedagogical approval or
proof of concurrent-upgrade behavior.

This migration is prepared locally only. Store/action integration, overlapping
upgrade/write tests, remote migration, and a controlled live upgrade remain to
be completed before enabling the feature. The authenticated server must check
student access and both live releases, then run full compatibility validation;
the SQL function deliberately does not substitute for that content validation.

Store integration is now prepared: `createLearningSuccessor` reads the original
persisted state, revalidates both live bundles, runs compatibility preparation,
and invokes the atomic RPC using the source revision. Latest-session and
latest-learning queries use the active-session view; direct history reads keep
using the original session table. No automatic upgrade or public action is
activated yet. Deploy migration 0150 before deploying this store version.
Validation: all 525 granular tests across 151 files and TypeScript passed.

## Concurrent persistence verification

The disposable full-schema harness now opens independent PostgreSQL connections
and observes an actual lock wait for each of three races: duplicate upgrades,
upgrade before save, and save before upgrade. Duplicate requests return one
successor. A save arriving after the upgrade cannot alter the predecessor. A
save committed first advances the revision and rejects the stale upgrade,
preserving that save. Final row assertions verify successor counts and source
revisions. All three cases passed with the full 150-migration schema.

This closes the concurrent-storage check above. Authenticated application
activation and remote rollout remain pending.

The authenticated `upgradeGranularLearning` action is prepared behind
`GRANULAR_LEARNING_UPGRADES_ENABLED=true` (disabled unless explicitly enabled).
It accepts no browser-supplied student or target release, checks role and current
access, uses the configured published default, and leaves unfinished diagnostics
and current-release sessions unchanged. Successful upgrades refresh lessons and
results; the response contains only a changed flag. Four action tests cover
identity/access, disabled and unfinished cases, and atomic-conflict propagation;
TypeScript and scoped lint passed. UI integration and remote activation remain.
