# French taxonomy v2 release approval

**Decision:** approve
**Approved checksum:** `sha256:809df529f0934fc8b68dcf23d00a18238a9c01490f4a985b4fa4246751a1fc4b`
**Approved by:** Jean-Philippe Kayobotsi, explicit release authorization in Codex on 10 September 2026.
**Scope:** Operational activation of the verified partial diagnostic using the existing approved questions. This is not a new human item-review or placement-mapping-review attestation.

The current live export and automated validator agree on 696 total questions,
265 eligible (232 human-approved and 33 deterministically computed), and 431
pending. All four sections meet the current partial-publication gates introduced
by migration 0124. Pending questions remain excluded from serving. Existing
reviewer identities, timestamps, provisional mappings, and evidence thresholds
are preserved. No learner mastery is inferred from publication approval.

This release authorization supersedes the earlier requirement to finish every
pending item before activation. The older record below is retained as history;
its pending decision and counts are not the current release decision.

## Historical review record

# French Taxonomy v2 release review

**Candidate version:** 2.0.0
**Candidate key:** `french-taxonomy-v2`
**Candidate checksum:** `sha256:809df529f0934fc8b68dcf23d00a18238a9c01490f4a985b4fa4246751a1fc4b`
**Historical decision:** pending diagnostic-bank review

## Scope

This candidate preserves the immutable v1 release and adds a granular spelling
foundation for the four-section adaptive diagnostic. It contains 161 competency
nodes, 155 prerequisite edges, 238 mastery-evidence definitions, and 322
progression mappings. The spelling slice contributes 23 lexical-spelling nodes,
17 grammatical-spelling nodes, and both recognition and written-production
evidence. V2 also adds controlled written-production evidence to the 33
construction nodes without changing the immutable v1 release.

## Publication gate

Do not mark this release `approve` until the canonical diagnostic item bank:

- targets v2 node identifiers and evidence definitions;
- meets the per-section node and item minimums;
- includes reading, grammar, spelling/dictation, and conjugation production;
- passes answer-key, prompt-family, difficulty-tier, and human-review checks;
- passes the section-adaptation and graph-path integration tests.
- has its provisional grade/CEFR progression mappings reviewed for the intended
  diagnostic population before those mappings are used as placement claims.

Publishing requires an explicit line in this document with the exact form
`**Historical decision:** approve` and an `**Historical approved checksum:**` line matching the
generated artifact. The importer intentionally fails closed without both.
