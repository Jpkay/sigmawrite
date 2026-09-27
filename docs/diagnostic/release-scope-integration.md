# Supported release scope while the full French graph remains intact

The owner permits student use during content review. This does not turn absent
questions or lessons into available activities. The approved graph, evidence rules
and full delivery objective remain unchanged.

Current candidate: 542 targets, 247 with allocated question pools, 295 incomplete.
All 52 targets in the current teaching prerequisite closure have pools. Only 29
lesson targets retain fresh follow-up capacity. The other 23 prerequisite targets
can still lack instruction when a learner struggles with them. Pool completeness
is not proof that every learner can enter a suitable lesson.

## Implementation contract

1. Add a versioned optional release scope, declaring assessmentSkillIds and
   teachingSkillIds. Keep all skills and prerequisites in the assessment. Reject
   duplicate/unknown IDs and pin the scope in the session release checksum.
   Scope absence retains the existing full-coverage policy.
2. Validate complete pool rules for every supported target without reducing
   novelty, guessing, contexts, text types or evidence requirements. Retain global
   graph integrity checks. Release only probes mapped to supported targets, while
   preserving the complete canonical source bank and approved parent coverage.
3. Route only within supported assessment targets. Deferred targets remain in
   results as unknown, never failed; they must not create a false coverage_gap.
   An actual shortage inside supported scope must still fail. Full-graph results
   remain provisional while unresolved targets exist.
4. Authorize learning and teaching commands against the corresponding scope.
   Keep prerequisite readiness intact and supply missing prerequisite lessons;
   repeating checks cannot replace teaching. Test failed-prerequisite profiles.
5. Expose supported/deferred counts and content-review status in the student DTO,
   excluding private permission manifests and answer keys. The first notice now
   explicitly says questions and activities are still being checked. This review
   status must not change any mastery classification or evidence.

Required tests: scope tampering, missing approved nodes, outside-scope probe/activity
submission, genuine supported shortages, pause/resume release identity, fullgraph
unknown results, unchanged cross-genre/novelty rules, and journeys from prerequisite
failure through actual instruction and a fresh check.

Parent-bank publication permission, granular DB migrations and release-store
integration remain separate work. An explicit scope alone does not satisfy them.

## Integration progress — 11 September 2026

Question scheduling and session transitions now enforce the immutable assessment
scope. Deferred targets stay in the full results map as unknown and do not create
false supported-pool shortages. Activity planning restricts checks to assessment
coverage and instruction/practice to teaching coverage. Released lesson validation
also rejects lessons outside teaching scope, independently of the UI planner.
Prerequisite readiness and mastery evidence thresholds remain unchanged.

Validation: 367 granular tests in 97 files pass; typecheck and targeted lint pass.
No scoped granular release has been activated. Parent-bank publication, release
registry integration, missing instruction, and full student journey validation
remain required. The deployed synthetic demo review is separate from this work.

The learning check registry now validates scoped probe membership, pins the scope
checksum, and labels each full-graph coverage row supported or deferred. The
Supabase release loader validates activity identities, exact targets, question
pool membership, and assessment-versus-teaching scope before serving the bundle.
Malformed null scopes are rejected during session identity binding.
Validation after this integration: 370 tests / 98 files pass; typecheck and
targeted lint pass. Production publication remains pending.

## Concrete candidate

`npx tsx scripts/build-scoped-review-candidate.mts` now builds
`v3-scoped-review-candidate.json` from the current parallel-review preparation.
It retains all 542 graph targets and unchanged evidence requirements; selects
745 allocated questions across the 52-target prerequisite closure; and includes
33 teaching targets. Nineteen prerequisite targets lack instruction.

The builder verifies pool, graph/bank, teaching, and activity contracts before
writing. It preserves retained pool assignments and repins lesson exposure IDs
and policy checksums for this exact scoped version. Material keys remain intact
for cross-release exposure history. No approval records are invented.

The candidate remains unpublished. Broader 542-target coverage, missing lessons,
publication integration, and end-to-end diagnostic/learning checks remain open.
Targeted bank/scope tests (13) pass, as does typecheck; reproducibility is verified
with `npx tsx scripts/build-scoped-review-candidate.mts --check`.

## Initial session simulations

`npx tsx scripts/benchmark-scoped-candidate.mts` runs six deterministic answer
profiles against the actual scoped candidate pools and session engine. All six
finish at 35 active minutes, 61 answers, after a verified one-hour pause. They
sample 19–24 targets and retain all 542 result rows. Deferred targets stay unknown.
All profiles receive next activities; weaker profiles expose 2–4 missing activity
targets, mainly on/om and object pronouns. These gaps remain open, not waived.

Per-target evidence probabilities distinguish the deliberately correct versus
incorrect sampled skills. All claims remain uncertain after this single occasion,
consistent with the approved multi-occasion mastery requirement. These are internal
model signals, not calibrated real-student accuracy estimates. This simulation
does not verify browser rendering, answer grading, database writes, or lessons
through completion. Its report includes these limitations explicitly.

## Student-facing availability

The public skill details now include `assessmentAvailable` for scoped releases.
The results UI labels deferred targets “Questions à venir”, distinguishes them
from available-but-untested targets, and explains that unavailable questions do
not indicate student difficulties. Evidence and probabilities remain unchanged.
Legacy releases omit this field and keep their existing labels. Eleven service
and result-group tests pass; typecheck and targeted lint pass. This UI change is
not deployed yet.

## Real server-command journey

`npx tsx scripts/verify-scoped-command-journey.mts` exercises actual candidate
questions through server grading commands with an isolated in-memory store.
Two profiles complete 61 answers in 35 active minutes (0 correct and 41 correct).
Both retain 542 result rows and successfully answer a fresh learning check. The
weak profile completes a recommended reading lesson and four guided exercises;
feedback is returned and guided practice does not change diagnostic evidence.
The command exits with failure for missing lessons/checks, unexpected grades,
missing feedback, repeated initial questions or lost learning evidence.

No production state is written. Browser rendering, Supabase persistence, and
complete material-history capture still need end-to-end verification. The report
records these limits and the exact scoped candidate checksum.

## Parent content provenance

The server loader now compares published taxonomy/bank `manifest_checksum` values
with the assessment's pinned checksums. Migration 0146 applies the same check at
granular release publication. Missing or mismatched references are rejected;
published IDs alone are not proof of matching content.

The disposable full-schema database applies all 145 migrations and passes the
persistence, access, full-graph, material exposure and practice annotation checks.
New SQL cases reject empty bundles and mismatched taxonomy/bank versions. Seven
store tests pass; typecheck and targeted lint pass. Migration 0146 is local only
and has not been applied to production. Parent-bank parallel-review publication
still needs implementation; this guard does not grant publication permission.

## Publication investigation

The legacy learning contract is pinned to french-diagnostic-bank-v2 / 2.0.0
(migration 0118), so publishing a separate v3 bank does not select it for that
contract. Migration 0124 permits pending-review memberships, but still requires
approved-only section readiness. The canonical v3 base has 238 approved items
and 492 pending items, with no rejected items. Reading and conjugation pass
section readiness; grammar and spelling each have only one confirmable approved
node (two required), despite 56 and 79 approved items respectively. Therefore
the current publication guard cannot publish the v3 candidate under the parallel
review decision without an explicit new publication path. Do not fabricate
approvals, falsely mark canonical validation valid, or weaken graph evidence.

Required next implementation: an exact-version parallel-review publication
contract, limited to the separate granular v3 bank and checked against the
validated scoped bundle. Keep the legacy approval-based publication path intact.
After updating the full-graph store fixture for real parent checksums, the full
granular suite passes 376 tests across 99 files.

## Publication contract implementation

`prepareParallelPublication` validates the graph/bank, scoped pools, teaching
permissions, and exact activity bindings. It pins bank, taxonomy, bundle, policy
and scope checksums. It reports missing instruction per supported target and
insufficient fresh bound follow-up questions after each lesson's exposure.
It does not mutate approval provenance or write database state. Legacy bank v2
is explicitly excluded from this contract.

`npx tsx scripts/prepare-scoped-publication.mts` writes the concrete preflight:
52 assessment targets, 35 teaching targets, 17 instruction gaps, zero fresh-check
gaps for the included lessons. Ready remains false. Tests cover unchanged input,
legacy exclusion, changed question provenance and removal of fresh check bindings.
The database permission record and publication transaction still need wiring;
this preflight is not itself publication or activation.

## Database parallel-review permission

Migration 0147 adds append-only, server-only publication permission records bound
to the bank ID, bank/taxonomy checksums, and exact bundle checksum. The preflight
must be ready, use the product-owner authorization, and have no instruction or
fresh-check gaps. The separate v3 bank can use this permission after standard
metadata, published-parent and membership eligibility checks; its relational
membership count must match the preflight bank item count. Legacy publication
readiness remains unchanged. A parallel-review granular release additionally
requires permission for its exact content checksum.

The disposable database applies 146 migrations and passes full-schema checks.
Synthetic SQL cases verify: pending-bank publication without permission fails;
failed preflights fail; permission permits the matching bank and bundle; another
bundle checksum fails; pending review remains pending; permissions cannot be
updated; browser roles have no access. No production migration or permission
record has been applied. The trusted publisher/permission insertion transaction
and live read-path permission verification still need integration.

Current candidate after four COD lessons: 47 lessons / 243 exercises, 39 teaching
targets within the 52-target closure, 13 instruction gaps, no fresh-check gaps.

## Exact permission reads and atomic publication

The store recomputes the publication preflight on parallel-review loads and
requires a matching immutable database permission for the exact bundle checksum.
Missing, stale, failing or unreadable permission cannot serve content. Ten
focused store/publication tests pass; typecheck and lint pass.

Migration 0148 adds a service-role-only publisher RPC. It locks/checks parents,
records permission, publishes the bank under parallel-review policy, then publishes
the granular bundle atomically. Only a platform-admin publisher identity is
accepted. Same-content retries return the existing release ID; a key conflict
fails and rolls back the bank transition. SQL tests cover draft-to-published
bank transition, retry identity, changed bundle rejection, browser RPC denial,
and conflict rollback. The full disposable suite applies 147 migrations.
No production application or database deployment occurred.

Latest lesson work: 50 lessons, 263 exercises, 42 teaching targets; 10 instruction
gaps remain in the 52-target closure (eight agreement, two explicit reading).

## Trusted server publisher

`publishParallelAssessment` validates operator and parent IDs, takes a fixed copy
of the supplied bundle, runs preflight, and performs no RPC when readiness fails.
It passes the exact validated bundle/proof to the atomic publication RPC, then
reloads it through the normal permission-aware store and verifies the resulting
checksum before reporting success. A failed post-publication read explicitly
reports that publication may already have occurred and directs an idempotent retry.
Three focused publisher tests pass; typecheck and lint pass.

The operator entry point still needs canonical relational import/verification
wiring before use against production. No production publication has occurred.

## Canonical relational comparison

The server publisher now invokes `verifyRelationalBank` before the publication
RPC. This read-only check pages through every bank membership, compares exact
node/evidence mappings and pool metadata, and compares prompts, answers, choices,
validators, QC gates and review provenance with the canonical source. Missing,
extra or altered records block publication. Timestamps are compared as instants;
operational rating statistics are intentionally excluded.

Tests exercise 501 records over two pages, missing/extra/wrong-target members,
changed answer keys and review metadata, timestamp formatting and operational
ratings. Publisher tests confirm relational failures prevent the RPC. Typecheck
and lint pass. This is a pre-publication read, not proof of concurrent-edit
isolation; the atomic RPC still needs a locked relational comparison to eliminate
the interval between verification and publication. No production writes occurred.
