# French Taxonomy v1 release record

**Candidate version:** 1.0.0

**Technical validation:** passed (`npm run ci`, 247 tests)

**Candidate checksum:** `sha256:c9fbcd3439f6db5429b8de8b74cc35d3adab0be93aecb8a20279f9cce8ef002d`

**Reviewer sign-off:** pending

## Release contents

The immutable artifact `generated/french-taxonomy-v1.json` combines the ontology and source-register checksums, conjugation, reading and construction graphs, cross-slice prerequisites, the baseline lexical release, the content-concept catalog, coverage statistics, validation results, and the unresolved-gap register.

After checksum-bound approval, `npm run taxonomy:import:v1` performs an idempotent import. It only changes the release to `published` when `TAXONOMY_PUBLISHER_PROFILE_ID` is supplied and this record contains the matching approved checksum; published database snapshots are protected by the G03 immutability triggers.

Run `npm run taxonomy:review:v1` to render the checksum-bound French release packet. Approval applies only to that exact checksum.

## Rollback and replacement

Published release 1.0.0 is never edited or deleted. If a defect is found:

1. mark the release withdrawn so it cannot be selected for new contracts;
2. preserve existing contracts, content, attempts, estimates, and completion evidence that reference 1.0.0;
3. correct authoring records in a new candidate version;
4. rebuild, validate, review, and publish the replacement release;
5. document compatibility and whether student estimates require bounded reinterpretation—never silent rewriting.

## Unresolved gaps

- advanced compound and literary tenses after the v1 set;
- detailed listening and speaking evidence;
- general-frequency lexical data beyond the original pilot corpus;
- empirical calibration of provisional progression boundaries.

These gaps are explicit in the release artifact and do not silently claim v1 coverage.
