# French diagnostic bank v2 release review

**Candidate key:** `french-diagnostic-bank-v2`
**Candidate version:** `2.0.0`
**Taxonomy:** `french-taxonomy-v2`
**Decision:** pending human item review
**Approved checksum:** pending
**Current candidate checksum:** `sha256:9a2380913405ee4110c898767ca848ed95922ed060387c250f1c4e4fe317fd24`
**Candidate inventory:** 696 items — 33 reproducibly computed, 198 human-approved, 465 awaiting human review, and none rejected

The complete candidate was authored locally without external model-generation
calls. After synchronizing 214 attributable staging decisions, the eight
rejected slots were replaced with new identities and wording based on the
reviewer notes. Those replacements remain unapproved. The planner now reports
696/696 slots and no generation request; `npm run diagnostic:audit:v2` reports
structural readiness with no hard, slot or projected issue. Migration `0106`
also corrects the former prompt-only duplicate false positives by comparing the
complete visible MCQ surface. This record must not be approved until all 465
pending items receive attributable human review and verification passes.

## Publication gate

Do not change the decision to `approve` until the synchronized bank artifact:

- contains only human-approved items, except deterministically recomputed conjugation items;
- records the reviewer profile and review timestamp for every human-approved item;
- passes all hard schema, graph-alignment, answer-key, and validator gates;
- has at least six directly testable nodes and eight approved probes in each section;
- has at least two nodes per section with enough approved items for every live
  mastery-evidence definition to meet its pinned distinct-item minimum;
- includes both receptive and controlled-production evidence, multiple prompt families, and multiple difficulty tiers;
- uses only live deterministic validators (`exact`, `regex`, or `conjugator`);
- contains no rejected or still-unreviewed membership;
- contains self-contained reading passages and no text-only item presented as an audio dictation;
- has human-confirmed passage/context diversity wherever the pinned evidence
  requires distinct texts (item counts alone do not prove text diversity);
- passes `npm run diagnostic:verify:v2` after the final review synchronization.

The approver must replace `pending` with the exact manifest checksum printed by
the verification command. The importer fails closed unless both the explicit
approval decision and exact checksum are present.
