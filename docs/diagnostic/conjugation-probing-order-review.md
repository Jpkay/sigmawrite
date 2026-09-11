# Draft order for probing conjugation

2026-09-11. Status: draft requiring pedagogical review and calibration.
Source: `src/lib/diagnostic/granular/conjugation-challenge.ts`.
Version: `french-conjugation-probing-v2` (extends the initial form-only v1 draft).

The approved graph defines prerequisites, not a complete difficulty scale.
Present-tense production has hard-prerequisite depth 2 while conditional production
has depth 1. Selecting by that depth could start a student with the conditional.
Changing approved graph edges to force a question order would conflate two
different purposes.

The compiled refined assessment therefore adds a separate `challengeOrder` to
verb and pattern form-production targets and the related tense-recognition and
interpretation targets. It preserves original node IDs, hard
prerequisites, graph depth and all evidence requirements. The order is included
in the draft facet artifact and the assessment release identity. Release validation
rejects altered ranks or ranks attached to unrelated targets.

| Draft rank | Tense/mood families to probe |
| --- | --- |
| 1 | Present indicative |
| 2 | Near future, recent past, imperative |
| 3 | Passé composé, imperfect, simple future |
| 4 | Pluperfect, conditional present, passé simple |
| 5 | Present subjunctive |

Recognition, producing a form and interpreting its use retain separate approved
node/evidence identities. The shared rank only orders the questions. Recognising
or interpreting a tense cannot supply production evidence, nor can one mode's
success complete another. The explicit mapping also includes the passé composé /
imperfect contrast at rank 3, including its independent-writing target. That target
remains deferred to learning and cannot be assessed through an initial cloze item.
Nodes without an explicit entry retain their existing routing metadata.

These ranks are an initial probing proposal, not measured item difficulty or
CEFR/student levels. Equal ranks do not impose a strict ordering. The proposal
starts with present forms, then broadens to constructions and other tense/mood
forms. Review must assess that sequencing for the intended student population,
including irregular forms and the relative difficulty of imperative, compound
forms and literary past forms. A student's familiarity can differ from this order.

Correct evidence permits a harder probe; errors permit a simpler probe; sufficient
foundation evidence allows a fresh return to a previously failed boundary. The
selector never credits an untested form, even when related forms were successful.
Approved multi-occasion mastery requirements still apply. Known present forms in
one sitting do not complete the present node or any later tense node.

Six regression tests cover present-first selection despite contradictory graph
depth, upward probing, conditional → future → present → fresh future recheck,
release rejection of modified or unrelated challenge metadata, exact approved-node
scope, and interpretation progression without transferring credit to production. The full-graph
simulation now starts regular-er and aller form probes at the present, followed
by near future; it retains the five-strand depth checks and time limit.

The general follow-up now reaches near-future interpretation rather than conditional
interpretation in the all-correct simulation.

Remaining limitations: general concepts outside the explicit tense mapping still
use graph depth; equal-rank ties still depend on stable question ordering; the first-entry
rank and six-question branch allowance remain uncalibrated. This proposal is not
approved by passing software tests. It must be reviewed with the candidate
assessment, and extended only with explicit scope and evidence.
