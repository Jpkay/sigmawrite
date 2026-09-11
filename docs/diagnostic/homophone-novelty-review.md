# Homophone evidence: novelty feasibility review

Status: proposal requires a decision. No graph change or runtime override.

Approved source: sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880. Audit checksum: sha256:715a68e613e3a176927c0fde9e8a62033fedbb0f9dd5a2e0ba34c23f80c9b09b.

## Observed conflict

The approved graph requires at least three distinct items and novel target words for each of these fixed-pair skills. The runtime identifies novelty by the assessed word, so different question IDs or sentences do not make the same target word new. Even counting both spellings separately provides at most two distinct target words. A faithful target-word annotation therefore cannot satisfy either question pool. Recognition questions exposing both choices can exhaust the pair even sooner.

| Skill | Recognition | Controlled production |
| --- | --- | --- |
| a / à | Blocked under target-word novelty | Blocked under target-word novelty |
| et / est | Blocked under target-word novelty | Blocked under target-word novelty |
| son / sont | Blocked under target-word novelty | Blocked under target-word novelty |
| on / ont | Blocked under target-word novelty | Blocked under target-word novelty |
| ce / se | Blocked under target-word novelty | Blocked under target-word novelty |
| ces / ses | Blocked under target-word novelty | Blocked under target-word novelty |
| ou / où | Blocked under target-word novelty | Blocked under target-word novelty |

## Concrete proposal for a separately versioned correction

For these seven competencies and their 14 evidence definitions only, replace the novel-target-word requirement with novel-sentence evidence. Preserve the competency IDs, prerequisite graph, recognition/production separation, minimum item counts, accuracy thresholds, contrasting-error criteria, unaided production and multiple occasions. Keep the approved v3 artifact and historical releases unchanged. A new checksum-bound decision would be needed before activating the correction.

Sixteen synthetic contexts per target fail allocation under the current rule and pass under the proposed sentence rule. This demonstrates feasibility, not educational validity, approval or sufficient reviewed content. Educator review must also ensure different meanings and sentence structures, not superficial rewording.

## What remains unchanged now

The production adapter and release guards still enforce the approved word-novelty rule. No question, facet or content approval is created. The full-graph synthetic integration bank uses artificial unique tokens and must not be mistaken for proof that real fixed-pair homophone tasks satisfy this contract.
