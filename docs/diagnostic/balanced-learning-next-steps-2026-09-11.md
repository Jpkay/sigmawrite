# Balanced visible learning activities

Local implementation, not deployed. The user chose to begin learning after the
30–40-minute diagnostic and refine unresolved skills along the way.

The planner previously displayed the first five eligible activities in global
priority order. A large set of early grammar or reading targets could fill those
slots before another area appeared. It now computes the same eligible candidates,
retains their evidence/prerequisite order within each area, and fills visible
slots one area at a time. Area order comes from the earliest eligible priority.

This does not change results, mastery criteria, publication/scope eligibility,
fresh-question checks, prerequisite readiness for instruction, or unavailable
prerequisite propagation. Independent verification of unknown skills remains
verification, not instruction based on presumed failure.

Validation: all 534 granular tests across 152 files, TypeScript and scoped lint
passed. A regression places three grammar candidates before one reading candidate
and verifies the first three visible slots include grammar, reading, then grammar,
while preserving unknown results. The prepared French catalogue is draft and
correctly offers no activities as-is. In a local simulation representing those
bindings as published (no release or approval mutation), the first five slots
cover grammar, reading comprehension, spelling, conjugation, then grammar.

This gives other areas a place in the visible pathway. It does not resolve the
two remaining initial-diagnostic contrast failures or demonstrate calibrated
longitudinal learning outcomes. Browser verification and deployment remain due.

## Candidate verification

Candidate db2158e is Ready at
https://sigmawrite-4h5efcaaq-jpkays-projects.vercel.app
(`dpl_ADSNHSgrSJnH49tS39A8abnBJsRm`). Browser verification against the completed
QA successor passed: five visible activities span grammar, reading comprehension,
spelling, conjugation, then grammar. Activity IDs were matched against the actual
published v10 bundle, and the rendered page was visually inspected.

A full timed diagnostic/learning/review run is in progress on existing unused QA
session 0119fba3-d0dd-4bad-b4b8-55a74b7774ab, pinned to v9 (163 targets), to check
compatibility with the new runtime. No assessment was reset or migrated. The
public alias remains on 0c859ca pending completion of that run.

## Public rollout checkpoint

Deployment `dpl_ADSNHSgrSJnH49tS39A8abnBJsRm` is now public. The preserved v9 session completed its timed browser journey, lesson, independent check and full answer review on this runtime. Public checks confirm five activities across grammar, reading, spelling and conjugation. The legacy demo retains eleven lessons and its 48-answer review. The default content release remains v10 (167 targets); v11 candidate verification is separate. See `routing-production-rollout-2026-09-11.json` and `routing-full-browser-journey-2026-09-11.json`.
