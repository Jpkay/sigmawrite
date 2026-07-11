# Conjugation foundation v1 review record

**Artifact:** `src/lib/taxonomy/slices/conjugation-foundation.ts`

**Automated validation:** passed (`npm run ci`, 219 tests)

**Content checksum:** `sha256:9a7a7ebab91005dab88efc75f26d92bb86774c24b8c2cde881e7d42e29e0fd1b`

**French educator sign-off:** pending

Run `npm run taxonomy:review:conjugation` to produce the complete French-readable review packet. The packet is generated from the source of truth and includes its deterministic content checksum, preventing approval of a stale or altered slice.

## Review scope

The reviewer must confirm that the slice:

- covers the v1 tense/mood set without implying grade–CEFR equivalence;
- separates form recognition, controlled formation, contextual meaning, and connected discourse use;
- gives passé composé/imparfait contrast explicit form, meaning, marker, and production prerequisites;
- treats passé simple as receptive-only;
- limits subjonctif production to named frequent constructions;
- distinguishes auxiliary choice, participle formation, and agreement;
- uses age-respectful observable evidence;
- maps likely misconceptions to the smallest useful node;
- contains no protected curriculum or CEFR wording.

## Automated evidence

The slice supplies 48 atomic nodes, 39 explicit hard/soft prerequisite rationales, L1 and FSL mappings, evidence criteria, seven misconception families, and five assessment-template purposes. Tests reject structural graph failures and assert coverage of every required v1 tense family.

## Required educator decision

Record reviewer name, role/qualification, review date, decision (`approve`, `approve_with_changes`, or `reject`), requested changes, and the reviewed commit SHA here or in the corresponding controlled review record. G06 must not be described as fully complete until the decision is `approve` and requested changes are resolved.
