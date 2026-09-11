# Existing graph and coverage work: investigation, 2026-09-10

The next step is reconciliation and a targeted gap audit, not authoring a new
French graph from scratch. The earlier recommendation understated existing work.

## What already exists

SigmaWrite's `generated/french-taxonomy-v3.json` contains 181 competencies and
230 edges: 60 conjugation, 40 reading comprehension, 37 grammar/syntax, 23 lexical
spelling and 21 grammatical spelling. Its approval is recorded in
`docs/french-taxonomy-v3-release.md`. It already models tense recognition,
production, interpretation, use in context, auxiliaries, participles, agreements,
verb families, pronouns, and prerequisites. Curriculum mappings exist in
`generated/curriculum-mappings-v1.json`.

The diagnostic is still pinned to v2 in `src/lib/diagnostic/protocol.ts`: 161
nodes and 155 edges. The v3 release decision explicitly retains v2 for diagnostics
until a suitable separately versioned bank is available.

The existing coverage planner, `scripts/plan-diagnostic-bank-v2.mts`, already
plans by node, evidence definition, question family, and difficulty. Its read-only
run reports 232 live evidence definitions, 696 planned slots, all 696 authored,
and six independent-production definitions deferred. Authored is not approved:
the canonical bank audit identifies only 265 eligible items. These are local
release-artifact counts, not a fresh live review-state export.

## Sovgraph findings

The Sovgraph checkout is on `fix/label-r-and-ingestion`; examining only that
checkout misses the curriculum work. Its `codex/source-backed-science-graph`
branch (worktree `../worktrees/sovgraph-science-learning-foundation`) contains the
Allotey Science curriculum service, source-backed prerequisite graph, complexity
pathways, lesson/assessment packages, and a question/XP matrix. Relevant commits
include `920d397` and `09f5c53`. This is reusable architectural work, but the
curriculum content inspected is science, not French.

No SigmaWrite/French curriculum references were found in the checked Sovgraph
checkout, main branch, or science branch. A read-only listing of the current
Hetzner Sovgraph data roots showed legal and generic/staging project directories,
with no named French project. This is not proof that no French export exists in
another workspace, historical unreferenced data, or another deployment.

## Corrected next step

1. Use approved French v3 and its evidence definitions as the baseline.
2. Reconcile the v2 diagnostic bank and live review state against v3; reuse valid
   questions with explicit mappings rather than copying approvals blindly.
3. Audit additional granularity demanded by this request. For example,
   `produire_present_indicatif` is a broad node: individual verb/family mastery is
   not represented just because a present-tense production node exists.
4. Extend only demonstrated gaps; preserve existing IDs and historical releases.
5. Adapt useful Sovgraph progression/assessment contracts; integrate the 35-minute
   diagnostic and learning refinement with the existing evidence/pathway system.

The new granular engine and 630 conjugation drafts remain prototypes, not a
replacement source of curriculum truth. No application, deployment, database, or
Sovgraph data was changed by this investigation.
