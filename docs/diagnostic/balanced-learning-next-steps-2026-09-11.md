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
