# Adaptive diagnostic v2

## Learner contract

The initial student experience is a four-section graph diagnostic:

| Section | Minimum | Maximum | Direct breadth |
| --- | ---: | ---: | ---: |
| Reading comprehension | 8 | 20 | 6 nodes |
| Grammar | 8 | 20 | 6 nodes |
| Spelling | 8 | 20 | 6 nodes |
| Conjugation | 8 | 20 | 6 nodes |

There is no fixed 15-question completion rule. Each section selects and stops
independently from its direct evidence, graph coverage, uncertainty, and next
expected information gain. A complete initial run therefore uses 32–80 probes.
If reviewed content is exhausted before the minimum evidence is credible, the
run is suspended as `insufficient_items`; it is never finalized as a reliable
placement.

## Evidence and path generation

Every issued occurrence is frozen with its item-bank release, taxonomy release,
canonical node, mastery-evidence definition, section, prompt family, difficulty
tier, and scoring snapshot. Response submission is atomic and idempotent.

Two probes alone do not automatically confirm mastery. Confirmation is tracked
against each exact mastery-evidence definition pinned in the taxonomy release,
not a pooled receptive/production score. Each definition must meet its own
distinct-item, occasion, accuracy, and posterior thresholds. Repeated
recognition questions therefore cannot hide weak controlled production.

Independent production is intentionally not auto-graded by this diagnostic.
When the taxonomy requires it, the node remains an explicit `verification`
step and cannot drive prerequisite inference as fully mastered. That path step
stores `independent_production` as its required evidence channel: receptive
reading and controlled node practice cannot complete it.

The current connected-writing evaluator provides trustworthy node-aligned
negative evidence when it detects a mapped error, but its generic summary
rubric does not prove that a learner successfully elicited any particular
construction. It therefore cannot positively complete an independent-production
step. A dedicated node-aligned writing prompt and pass rubric are still needed
for positive autonomous-writing verification; until then, such steps remain
visible and pending rather than being completed from fabricated evidence.

Direct evidence updates overall mastery and the applicable receptive,
productive, written, or oral dimension. A successful high-level probe may infer
hard prerequisites, but inferred evidence remains distinguishable from direct
evidence. Untested nodes remain `unknown` rather than becoming false gaps.

Finalization creates a persisted, prerequisite-safe learning path immediately:

1. missing foundations (`remediation`);
2. partial mastery (`consolidation`);
3. unknown or insufficiently confirmed skills (`verification`).

Confidently mastered nodes are omitted. Completing a path step unlocks dependent
steps only after retained prerequisite steps are completed; an old aggregate
score cannot bypass a verification step. Re-entry runs preserve coverage-aware
results only from the latest completed run pinned to the exact same taxonomy
release and protocol. That lets previously confirmed mastery remain confirmed
when it is not reprobed, while any evidence from the current run remains
authoritative for a retested node. Unversioned aggregate history stays
unconfirmed context.

The assessed nodes are limited to the active grade/CEFR goal and their hard
prerequisite closure. Re-entry runs focus on stale or uncertain targets and fall
back to the goal scope only when a section would otherwise lose required breadth.

## Release workflow

The student action fails closed until a matching v2 taxonomy and diagnostic bank
are both published.

1. Verify the already-frozen v1/v2 taxonomy artifacts. Do not rebuild an
   approved release from a later mutable source register:

   ```sh
   npm run taxonomy:verify:v1
   npm run taxonomy:verify:v2
   ```

2. Import the v2 taxonomy as a validating release, without a publisher ID.
3. Generate the resumable bank workspace. Generation fills one stable slot per
   evidence, prompt family, and difficulty tier and does not overwrite reviewed
   candidates:

   ```sh
   npm run diagnostic:plan:v2
   npm run diagnostic:generate:v2
   ```

   The plan command is read-only and reports the exact remaining model-request
   envelope before any paid generation begins.

4. Stage the draft bank and its items:

   ```sh
   npm run diagnostic:import:v2
   ```

5. In `/admin/items/review`, select active real educators and assign all
   unowned items. The guarded allocator gives each item one accountable owner,
   balances the selected workloads, alternates sections in personal queues,
   notifies reviewers and records one audit event. Review every
   `needs_human_review` item; reject any ambiguous, unsupported,
   non-self-contained, duplicate or answer-key-unsafe item.
6. Synchronize reviewer edits and decisions back into the canonical artifact:

   ```sh
   npm run diagnostic:sync-reviews:v2
   ```

   Re-run generation/import/review/sync when rejected slots need replacements.
7. Verify the final artifact:

   ```sh
   npm run diagnostic:verify:v2
   ```

8. Record the exact taxonomy and bank checksums in their release-review files,
   change each decision to `approve`, then import with the corresponding
   publisher profile IDs. The bank cannot publish before its taxonomy.
9. Apply migrations through `0106`, run the database tests, and execute a staged
   student sign-in → onboarding → diagnostic → generated-path end-to-end test.

## Current launch gate

The engine, persistence model, assessment-first student UI, taxonomy v2,
generation/review tools, guarded workload allocator and automated checks are
implemented. The 2026-09-01 candidate records 198 human approvals, 33
reproducibly computed approvals and 465 pending reviews in a complete 696-item
workspace. All eight formerly rejected slots now have new locally authored
identities that incorporate the reviewer notes and remain pending human
approval. The audit is structurally ready with no missing slot. Migration
`0106` supersedes the prompt-only false positives from `0105`: MCQ uniqueness
now includes the order-insensitive visible choices, while open-response prompts
remain strictly unique and choice mutations are guarded at the database
boundary. The release documents intentionally remain pending, so a
student-facing v2 run must not be presented as available yet; always use current
command output as the authoritative count.

Run `npm run diagnostic:audit:v2` for the non-mutating candidate audit. It
verifies hard QC, exact evidence slots, reading text and text-type diversity,
and projected section readiness without pretending that review has occurred.

Migration `0069` enforces assessment-first access beyond the client redirect:
post-diagnostic Server Actions, authenticated learning-write RLS policies, and
security-definer learning writers all fail closed until the exact published v2
run has four completed sections, 32–80 probes, its final result and estimate,
and its graph-derived learning path.
