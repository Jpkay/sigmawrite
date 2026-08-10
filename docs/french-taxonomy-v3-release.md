# French Taxonomy v3 release decision

**Candidate key:** `french-taxonomy-v3`

**Version:** `3.0.0`

**Decision:** approve

**Approved checksum:** `sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880`

**Approval date:** 2026-08-10

**Decision authority:** Product owner instruction in the SigmaWrite implementation task, with checksum-bound engineering release gates.

## Scope approved

- 181 atomic competencies and 230 reviewed prerequisite relationships.
- Separate object-pronoun competencies for COD, COI, COD/COI discrimination, `y/en`, placement, preceding-COD agreement and double-pronoun order.
- Explicit recognition → controlled production → contextual interpretation → independent production chains for every included verb tense.
- No isolated instructional node, no advanced root without a prerequisite, and no productive root except the explicit foundation allowlist.
- A readiness threshold of 0.65 for adjacent advancement and a mastery threshold of 0.85 for completion. Advancing does not complete the earlier node.
- FSRS-6 desired-retention scheduling at 0.90, with review-heavy sessions at low mastery and progressively more new material as mastery rises.
- Approved Lexique 4 reference `sigma-french-lexique4@4.00.1`: 2,005 lemmas, 19,374 forms and 98.08% held-out coverage.

## Release constraints

- Version 2 remains immutable for historical attempts and learning paths.
- Independent-production nodes require unaided connected-writing evidence and are not completed by cloze exercises.
- The current v2 diagnostic bank remains active until a separately checksum-bound v3 bank has sufficient human-reviewed items. This does not weaken v3 practice scheduling or the v3 release itself.
- Lexique 4 remains a separately governed CC BY-SA 4.0 lexical release. This taxonomy stores only its release identity, checksum and coverage report; it does not redistribute the lexical database.

## Verification gates

- Base taxonomy schema, provenance, acyclicity and CEFR monotonicity validation.
- Instructional progression validation rejecting isolated, advanced-root and productive-root defects.
- Unit contracts for every tense chain and every pronoun stage.
- Reproducible artifact check through `npm run taxonomy:verify:v3`.
