# Granular profile-test inventory

This inventory supports roadmap item P2.01. These checks are synthetic technical evidence. They do not establish educational calibration, owner review, or student mastery.

| Existing check | Explicit distinction | What it proves | Remaining gap |
| --- | --- | --- | --- |
| `profile-discrimination.test.ts` | Declared known vs weak sides; optional same-branch boundary | A contrast cannot pass from unrelated evidence, and now cannot pass while any declared target is unresolved | Does not run the selector or bind released questions |
| `verb-tense-profile.test.ts` | Individual verbs within a tense; tenses for one verb | Direct evidence remains separate and the weak target receives its own lesson | Feeds all target-pool answers directly; no selection trace; uses the mutable authoring candidate |
| `compound-tense-profile.test.ts` | Passé composé vs plus-que-parfait; venir vs prendre | Compound-tense and individual-verb evidence does not leak | Feeds all target-pool answers directly; no next-activity trace |
| `determiner-profile.test.ts` | Recognition vs production | Mode evidence and lessons remain separate; fresh independent checks can refine one target | Draft assembly fixture rather than revision 41 |
| `relative-mode-profile.test.ts` | Relative-clause recognition vs production | Mode-specific aggregation, prerequisites, guided-work isolation, and fresh refinement | Direct pool injection rather than selector replay |
| `conjugation-form-family.test.ts` | Simple, periphrastic, and compound forms across verbs | Step-up, step-down, boundary recheck, and bounded branch visits | Small synthetic graph, not released questions |
| `engine.test.ts`, `skip.test.ts`, `learning-progress.test.ts` | Individual verbs, tense boundaries, modes, skips, contradictions, later evidence | Core inference and routing invariants | Separate cases do not yield one auditable profile artifact |
| `synthetic-reading-profiles.test.ts` | Literal/inferential and reference-resolution knowledge | Profile definitions name approved graph nodes without borrowing neighboring evidence | Does not run released reading questions |
| `revision-41-profile-simulation-2026-09-12.json` | Four full-budget synthetic profiles | Revision-41 sampled-skill summaries, completion reason, and activity summaries | Omits the ordered question/reason/difficulty/time/evidence trace; one declared reading comparison remained unexercised |

P2.02 adds `profile-trace-runner.ts`. Fixed target outcomes now produce an ordered record of the released question ID, skill ID, mode, selector reason, difficulty, expected and cumulative active time, immediate evidence state, terminal state, unresolved contrast targets, and first planned activity. The first P2.03/P2.04 slice runs the released revision-41 `aller` present/imparfait boundary. Synthetic prerequisite history is explicit and excluded from sitting time.

Still missing after this slice: complete verb-family and individual-verb matrix coverage, other tense and agreement pairs, grammar, spelling and reading contrasts, guesses/skips/inconsistency profiles, post-teaching refinement traces, and contrasting deployed journeys.
