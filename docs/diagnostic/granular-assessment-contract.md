# Granular adaptive diagnostic — implementation contract

Requested behavior: locate a student's separate frontiers on a knowledge graph;
never collapse them into one French level. School grade is a starting hint, not
an assessment ceiling. Correct answers lead toward more complex tasks; errors
lead to simpler prerequisites; successful recovery leads back to a different
question near the previous failure. Every domain must receive its own evidence.

## Units of evidence

- Separate être and avoir, and separate each verb/family × tense combination.
- Separate recognizing a form, producing it, and choosing its use in context.
- Grammar and spelling retain independently assessed nodes; recognizing an
  agreement never certifies producing it.
- Reading uses self-contained short passages, with independent nodes for explicit
  information, references, vocabulary in context, inference, main idea, sequence,
  viewpoint, and evidence. Passage difficulty and skill difficulty are distinct.
- Store the item, target node, response mode, context, attempt, and uncertainty.
  Item answer keys are server-owned and never sent to the selection simulator.

## Selection and stopping

Cover branches first, then alternate boundary searches and confirmation.
A wrong answer is evidence about its target, not proof that all ancestors are
missing. A correct answer may guide selection but cannot silently certify an
untested ancestor, sibling, verb, tense, or response mode.

Require independent questions before confirming a node; contradictory responses
need another probe. A boundary requires evidence below and above it. Separate
prerequisite edges (learning dependency) from challenge edges (where to probe
next); a complexity ordering is not proof of a logical dependency.

Budget is active answering time, excluding idle time and pauses. Essential
anchors such as être and avoir in the present are directly assessed even when
challenge routing would start higher. Confirmed user preference: 30–40 minutes; target 35 minutes of active answering. At the time cap, start learning from the assessed skills and refine unresolved
areas through targeted activities. Report an explicitly provisional boundary; it must not be reported as certainty.
No fixed twelve-question section cap may override unresolved core branches.

## Results and pathway

Return per-node evidence, confidence, tested modes, unresolved modes, and a
separate frontier for every branch. Broad domain summaries are navigation aids.
Expose three distinctions: directly assessed, inferred hypothesis, untested.
Show the next small set of priorities and their reasons. Missing foundations get
instruction; uncertain foundations get verification; confidently mastered skills
are skipped. Preserve the broader map without presenting it as hundreds of
proven weaknesses.

## Release requirements

The current 265-item partial bank is not sufficient evidence of readiness for
this contract. Audit coverage per node and mode, not total questions per section.
New granular nodes must have question coverage, answer validation, prerequisites,
and matching learning activities. Existing reviewer approvals must not be copied
onto changed or newly authored questions.

Use predeclared simulated student skill maps, including identical total ability
with different gaps, recognition/production splits, être/avoir splits, individual
tense boundaries, strong advanced skills with prerequisite gaps, guessing,
contradictions, and long interruptions. Test selection, evidence classification,
stopping, and first learning activities together. Simulations check behavior;
they do not substitute for calibration against students and educator judgments.

## Work completed in this session

- Reproducible release-artifact coverage audit: 265 eligible items; 161 nodes;
  40 uncovered; only 16 satisfy the declared live-mode distinct-item minimums.
  This is an artifact audit, not a new live database export or release approval.
- Separate prototype selector, evidence classifier, and pathway-priority builder
  under `src/lib/diagnostic/granular/`.
- Regression simulations cover independent verbs and tenses, down/recheck/up,
  prerequisite gaps, mode splits, untested skills, repeated observations,
  time budgets, missing content, and equal scores with different first lessons.
- Serializable session transition layer with a pinned release, revision checks,
  pause/resume, bounded heartbeat accounting, idempotent answers, and a transition
  to learning at the time budget. Guided answers and repeated items cannot certify
  new mastery. This is a pure server integration component, not database persistence.
- Domain-time balancing prevents the larger number of conjugation branches from
  crowding out other domains. Contradictory recent responses require confirmation.
- Per-node/mode readiness checks require approved items, reserve questions,
  independent contexts, valid prerequisites, and matching learning activities.
- Exhaustive simulations of all 64 known/unknown combinations across six verb/tense
  skills produce the expected classifications and learning priorities. An additional
  1,024 seeded runs model guessing and slips; see `granular-simulation-report.json`.
  Some misclassifications remain: these are regression experiments, not empirical
  estimates of accuracy for students. Likelihood parameters remain uncalibrated.
- Draft deterministic conjugation bank: ten verbs × eleven tenses = 110 separate
  form-production skills, with 630 questions. Answer keys derive from the existing
  conjugator. This is not a published taxonomy or an approved diagnostic bank.

## Still required before this replaces the live diagnostic

1. Connect the implemented 35-minute session transition layer to authenticated
   persistence and the student interface. Learning begins afterward; independent
   checks during learning refine unresolved skills without a mandatory second sitting.
2. Complete the granular taxonomy, separating challenge order from prerequisites;
   review the mapping and add meaning-in-context probes. The prototype's levels
   are routing hints, not validated educational progression claims.
3. Fill reading, grammar, and spelling coverage with short, independently checked
   contexts and multiple evidence modes. The conjugation candidate alone cannot
   satisfy the requested scope.
4. Calibrate the provisional likelihoods/stopping policy; extend stochastic
   profile simulations and compare expected pathways before release.
5. Add release-pinned database persistence and selection integration, server-side
   active-time accounting, pause/resume, granular results and learning activities.
6. Verify migration, old-run compatibility, and complete live student journeys.

The current production diagnostic remains unchanged. Do not describe these
prototype files or draft item counts as an activated granular diagnostic.

## Validation and integration boundary

Run `npx vitest run src/lib/diagnostic/granular`, `npm run typecheck`, and
`npx eslint src/lib/diagnostic/granular`. Rebuild the candidate and synthetic report
with `scripts/build-granular-conjugation-candidate.mts` and
`scripts/benchmark-granular-diagnostic.mts` using `tsx`.

The session adapter must authenticate the student, load the stored snapshot and
pinned approved release, grade answers on the server, and save transitions with
an atomic revision comparison. Never accept `correct`, observations, release
metadata, or server timestamps from browser payloads. A visible unpaused client
sends heartbeats every 15 seconds; a gap charges at most 30 seconds. This is an
estimate of engagement, not a claim to detect attention. Explicit pauses charge
no time. Client heartbeat wiring and the authenticated adapter are not yet built.

The 630 conjugation drafts cover isolated form production only. They do not cover
all French verbs or tenses, do not establish use in context, and currently contain
no reviewed prerequisite mapping. Imperative skills have only three items and
therefore fail the new reserve-item requirement. No draft is release eligible.

## Correction after existing-work investigation

Do not rebuild the French taxonomy or coverage planner from scratch. Approved
v3 already contains 181 competencies and 230 relationships, and the v2 coverage
planner already specifies 696 authored question slots. Start from these assets,
reconcile releases and approvals, then extend demonstrated granularity gaps.
Sovgraph also contains reusable Allotey Science curriculum/assessment contracts.
See `sovgraph-reuse-investigation-2026-09-10.md` for the evidence and limitations.
