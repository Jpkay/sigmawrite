# French diagnostic bank v2 release review

**Candidate key:** `french-diagnostic-bank-v2`
**Candidate version:** `2.0.0`
**Taxonomy:** `french-taxonomy-v2`
**Decision:** pending human item review
**Approved checksum:** pending
**Current candidate checksum:** `sha256:74efcf0e259cac4c5d598eb10d2d741891700c171de9a96789147b8ad5840042`
**Candidate inventory:** 696 items — 33 reproducibly computed and 663 awaiting human review

The complete candidate was authored locally without external model-generation
calls. `npm run diagnostic:audit:v2` confirms exact three-item coverage for all
232 live evidence definitions, three reading sources per reading evidence,
required text-type diversity, hard QC, and projected four-section readiness.
This structural audit is not a substitute for the pending human review.

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
