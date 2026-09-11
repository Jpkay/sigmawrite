# French v3 delivery matrix

Generated from the approved French graph and current local source artifacts. Drafts and eligible questions remain separate.

Regenerate: `npx tsx scripts/build-v3-delivery-matrix.mts`. Verify without writing: append `--check`.

## Domain overview

| Domain | Targets | Eligible questions | Targets without eligible questions | Allocated pools | Expansion drafts |
| --- | ---: | ---: | ---: | ---: | ---: |
| conjugation | 255 | 77 | 195 | 0 | 3958 |
| reading_comprehension | 92 | 21 | 74 | 0 | 96 |
| grammar | 79 | 56 | 43 | 0 | 290 |
| spelling | 116 | 79 | 60 | 0 | 270 |

## Exact-target teaching work

These counts describe authoring drafts, not approved lessons or published pathway bindings. A target without a draft may have reusable parent content; consult v3-teaching-reuse-audit.json before authoring a replacement.

| Domain | Targets with teaching drafts | Targets without teaching drafts | Guided exercise drafts |
| --- | ---: | ---: | ---: |
| conjugation | 107 | 148 | 632 |
| reading_comprehension | 11 | 81 | 50 |
| grammar | 25 | 54 | 132 |
| spelling | 19 | 97 | 90 |

## Sampling strands

The selector balances these approved strands within each broad domain before selecting a finer branch. Lexical and grammatical spelling share the spelling time budget but receive separate sampling attention.

- conjugaison: 255 targets, 77 eligible questions
- comprehension_ecrite: 92 targets, 21 eligible questions
- grammaire_syntaxe: 79 targets, 56 eligible questions
- orthographe_grammaticale: 62 targets, 42 eligible questions
- orthographe_lexicale: 54 targets, 37 eligible questions

## Evidence enforcement gaps

Fourteen homophone evidence targets also have a fixed-pair novelty conflict. See `homophone-novelty-review.md`; adding more sentence drafts alone cannot satisfy the current target-word rule. The proposed correction is not approved or applied.

These approved requirements still need implementation or validation. A sufficient question pool alone does not make these targets releasable.

- unaidedTransferRequired: 18 targets
- evidenceSpanRequired: 25 targets
- novelSentencesRequired: 35 targets
- novelWordsRequired: 98 targets
- minimumEligibleTokens: 4 targets

## Material annotation work

The accompanying JSON lists exact question IDs missing explicit assessed identities for each target, separately for eligible questions, exact-target drafts and shared parent drafts. Shared parent candidates still require mapping and can appear on several targets. Required word/sentence annotations follow the approved novelty criteria; absent annotations already prevent those pools from passing. Presence alone does not prove novelty or approval.

- eligible: 68 targets with missing required identities
- exactTargetDrafts: 0 targets with missing required identities
- sharedParentDrafts: 125 targets with missing required identities

## Target work queue

Full evidence requirements, prerequisite IDs, question IDs, source checksums and shared parent candidates are in the accompanying JSON. Every row still needs exact-target instruction and practice bindings. Expansion counts are unreviewed drafts, not coverage.

| Target | Mode / stage | Eligible | Initial / later | Exact question drafts | Teaching drafts / guided exercises | Next question action | Next teaching action |
| --- | --- | ---: | --- | ---: | --- | --- | --- |
| Identifier le sujet du verbe | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 16 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Identifier les traits de personne-nombre | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 24 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Segmenter une forme verbale | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 10 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Classer une famille verbale | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître un auxiliaire | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 12 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir l'auxiliaire d'un temps composé — Choisir avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir l'auxiliaire d'un temps composé — Choisir être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir l'auxiliaire d'un temps composé — Verbe changeant d’auxiliaire selon son emploi | production / initial | 0 | 0 / 0 (insufficient_coverage) | 28 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir l'auxiliaire d'un temps composé — Verbe pronominal | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Former un participe passé — Participes en -é | production / initial | 0 | 0 / 0 (insufficient_coverage) | 12 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Former un participe passé — Participes en -i | production / initial | 1 | 1 / 0 (insufficient_coverage) | 12 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Former un participe passé — Participes irréguliers | production / initial | 0 | 0 / 0 (insufficient_coverage) | 12 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Accorder le participe passé avec être — Accord au féminin | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Accorder le participe passé avec être — Accord au pluriel | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Accorder le participe passé avec être — Accord en genre et en nombre | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Accorder le participe passé avec un COD antéposé — COD placé avant | production / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Accorder le participe passé avec un COD antéposé — COD placé après | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Accorder le participe passé avec un COD antéposé — Absence de COD | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Interpréter un marqueur temporel | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le présent de l'indicatif | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 10 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer prendre | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer venir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Verbes réguliers en -er | production / initial | 1 | 1 / 0 (insufficient_coverage) | 68 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Verbes en -ir comme finir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 44 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 30 | 1 / 8 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le présent de l'indicatif — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 30 | 1 / 8 | review_exact_target_drafts | review_teaching_scope_and_content |
| Interpréter les usages du présent | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le futur proche | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur proche — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer prendre | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer venir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer partir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Verbes réguliers en -er | production / initial | 1 | 1 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Verbes en -ir comme finir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur proche — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter la valeur du futur proche | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le passé récent | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé récent — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer prendre | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer venir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer partir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Verbes réguliers en -er | production / initial | 0 | 0 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Verbes en -ir comme finir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé récent — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter la valeur du passé récent | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le passé composé | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 12 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer prendre | production / initial | 1 | 1 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer venir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le passé composé — Verbes réguliers en -er | production / initial | 1 | 1 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé composé — Verbes en -ir comme finir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé composé — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé composé — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter la valeur du passé composé | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître l'imparfait | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 12 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer prendre | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer venir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer voir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire l'imparfait — Verbes réguliers en -er | production / initial | 1 | 1 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'imparfait — Verbes en -ir comme finir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'imparfait — Verbes en -ger | production / initial | 1 | 1 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'imparfait — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter les valeurs de l'imparfait | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Contraster les temps du récit | recognition / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Produire le contraste passé composé-imparfait | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Reconnaître le passé simple | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter la valeur narrative du passé simple | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le futur simple | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 12 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer prendre | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer venir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le futur simple — Verbes réguliers en -er | production / initial | 1 | 1 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur simple — Verbes en -ir comme finir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur simple — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le futur simple — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter les valeurs du futur simple | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le plus-que-parfait | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 12 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer prendre | production / initial | 1 | 1 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer venir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le plus-que-parfait — Verbes réguliers en -er | production / initial | 1 | 1 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le plus-que-parfait — Verbes en -ir comme finir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le plus-que-parfait — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le plus-que-parfait — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter l'antériorité passée | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le conditionnel présent | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 12 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer prendre | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer venir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 20 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Produire le conditionnel présent — Verbes réguliers en -er | production / initial | 1 | 1 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le conditionnel présent — Verbes en -ir comme finir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le conditionnel présent — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le conditionnel présent — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter les valeurs du conditionnel présent | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le subjonctif présent | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer être | production / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer avoir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer faire | production / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer prendre | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer venir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Verbes réguliers en -er | production / initial | 0 | 0 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Verbes en -ir comme finir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire un subjonctif présent fréquent — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter un déclencheur du subjonctif | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître l'impératif | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer prendre | production / initial | 1 | 1 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer venir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 6 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Verbes réguliers en -er | production / initial | 1 | 1 / 0 (insufficient_coverage) | 42 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Verbes en -ir comme finir | production / initial | 1 | 1 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 18 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire l'impératif — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 18 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Interpréter la valeur de l'impératif | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Distinguer infinitif/participe passé | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer une forme verbale non finie | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter une séquence temporelle | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Produire une séquence temporelle cohérente | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Localiser une information explicite — Récit bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Localiser une information explicite — Texte informatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Localiser une information explicite — Texte argumentatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Associer une information à la question posée — Récit bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Associer une information à la question posée — Texte informatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Associer une information à la question posée — Texte argumentatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Ordonner des événements explicitement datés — Récit bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Ordonner des événements explicitement datés — Texte informatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Ordonner des événements explicitement datés — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Résoudre la référence d'un pronom sujet — Récit bref | interpretation / initial | 2 | 2 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Résoudre la référence d'un pronom sujet — Texte informatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Résoudre la référence d'un pronom sujet — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Résoudre la référence d'un pronom objet — Récit bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 16 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Résoudre la référence d'un pronom objet — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Résoudre la référence d'un pronom objet — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Résoudre une reprise démonstrative — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Résoudre une reprise démonstrative — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Résoudre une reprise démonstrative — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Suivre une chaîne lexicale — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Suivre une chaîne lexicale — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Suivre une chaîne lexicale — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déduire un mot grâce à une définition locale — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déduire un mot grâce à une définition locale — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Déduire un mot grâce à une définition locale — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déduire un mot grâce à un exemple ou un contraste — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déduire un mot grâce à un exemple ou un contraste — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Déduire un mot grâce à un exemple ou un contraste — Texte argumentatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déduire un mot grâce à sa morphologie — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déduire un mot grâce à sa morphologie — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déduire un mot grâce à sa morphologie — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir le sens contextuel d'un mot polysémique — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir le sens contextuel d'un mot polysémique — Texte informatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir le sens contextuel d'un mot polysémique — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée centrale d'une phrase complexe — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée centrale d'une phrase complexe — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée centrale d'une phrase complexe — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée principale d'un paragraphe — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée principale d'un paragraphe — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée principale d'un paragraphe — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée principale d'un texte — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée principale d'un texte — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier l'idée principale d'un texte — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une structure chronologique — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une structure chronologique — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une structure chronologique — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une structure causale — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une structure comparative — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une structure problème-solution — Texte informatif bref | interpretation / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier le rôle d'un paragraphe — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier le rôle d'un paragraphe — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier le rôle d'un paragraphe — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Inférer une cause locale — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Inférer une cause locale — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Inférer une cause locale — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Inférer une conséquence locale — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Inférer une conséquence locale — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Inférer une conséquence locale — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Inférer une relation temporelle implicite — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Inférer une relation temporelle implicite — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Inférer une relation temporelle implicite — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Inférer la motivation d'un personnage — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Inférer une conclusion informationnelle — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Sélectionner les éléments essentiels d'un résumé — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Sélectionner les éléments essentiels d'un résumé — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Sélectionner les éléments essentiels d'un résumé — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reformuler une idée sans la copier — Récit bref | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Reformuler une idée sans la copier — Texte informatif bref | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Reformuler une idée sans la copier — Texte argumentatif bref | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Organiser un résumé informatif — Texte informatif bref | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Organiser un résumé narratif — Récit bref | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier un point de vue — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier un point de vue — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier un point de vue — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Comparer deux points de vue — Récit bref | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Comparer deux points de vue — Texte informatif bref | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Comparer deux points de vue — Texte argumentatif bref | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter une tonalité littéraire — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier la position d'un auteur informatif — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Distinguer un fait d'une opinion — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Identifier une thèse — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une raison argumentative — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Évaluer la pertinence d'une preuve — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître un contre-argument — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Localiser un passage servant de preuve — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Localiser un passage servant de preuve — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Localiser un passage servant de preuve — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Relier une preuve à une interprétation — Récit bref | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Relier une preuve à une interprétation — Texte informatif bref | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Relier une preuve à une interprétation — Texte argumentatif bref | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Distinguer preuve textuelle/connaissance externe — Récit bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Distinguer preuve textuelle/connaissance externe — Texte informatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Distinguer preuve textuelle/connaissance externe — Texte argumentatif bref | interpretation / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Reconnaître une phrase canonique | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 16 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Reconnaître une phrase canonique | production / initial | 1 | 1 / 0 (insufficient_coverage) | 16 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Reconnaître une coordination | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une coordination | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une subordonnée relative | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 16 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Reconnaître une subordonnée relative | production / initial | 0 | 0 / 0 (insufficient_coverage) | 12 | 1 / 8 | review_exact_target_drafts | review_teaching_scope_and_content |
| Reconnaître une subordonnée complétive | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 16 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Reconnaître une subordonnée complétive | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une subordonnée circonstancielle | recognition / initial | 3 | 3 / 0 (insufficient_coverage) | 20 | 1 / 7 | review_exact_target_drafts | review_teaching_scope_and_content |
| Reconnaître une subordonnée circonstancielle | production / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Reconnaître une construction passive | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une construction passive | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une nominalisation | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une nominalisation | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter un pronom sujet | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter un pronom sujet | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter un pronom relatif | recognition / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Interpréter un pronom relatif | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter une reprise démonstrative | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter une reprise démonstrative | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Suivre une chaîne de référence | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Suivre une chaîne de référence | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une chaîne lexicale cohésive | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une chaîne lexicale cohésive | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Analyser l'accord déterminant-nom | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 16 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord déterminant-nom | production / initial | 2 | 2 / 0 (insufficient_coverage) | 24 | 1 / 8 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord nom-adjectif | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Analyser l'accord nom-adjectif | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Analyser l'accord sujet-verbe — Sujet proche du verbe | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord sujet-verbe — Sujet éloigné du verbe | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord sujet-verbe — Sujet placé après le verbe | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord sujet-verbe — Plusieurs sujets coordonnés | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord sujet-verbe — Sujet proche du verbe | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord sujet-verbe — Sujet éloigné du verbe | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord sujet-verbe — Sujet placé après le verbe | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord sujet-verbe — Plusieurs sujets coordonnés | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Analyser l'accord d'un participe passé | recognition / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Analyser l'accord d'un participe passé | production / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Reconnaître une négation simple | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 16 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Reconnaître une négation simple | production / initial | 0 | 0 / 0 (insufficient_coverage) | 16 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Interpréter une négation complexe | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Interpréter une négation complexe | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déterminer la portée d'une négation | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Déterminer la portée d'une négation | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de cause | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de cause | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de conséquence | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de conséquence | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de contraste | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de contraste | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de concession | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de concession | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation chronologique | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation chronologique | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation d'addition | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation d'addition | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier un exemple ou une reformulation | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier un exemple ou une reformulation | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de condition | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de condition | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de but | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier une relation de but | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le discours direct | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le discours direct | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le discours indirect | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le discours indirect | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier un point de vue narratif | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Identifier un point de vue narratif | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une progression thématique | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître une progression thématique | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Segmenter un mot en syllabes écrites | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Segmenter un mot en syllabes écrites | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Associer un phonème à une graphie fréquente | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Associer un phonème à une graphie fréquente | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies o/au/eau | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies o/au/eau | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies k/c/qu | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies k/c/qu | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies g/ge/gu — Maintenir le son doux avec ge | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies g/ge/gu — Maintenir le son dur avec gu | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies g/ge/gu — Maintenir le son doux avec ge | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies g/ge/gu — Maintenir le son dur avec gu | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies s/ss/c | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies s/ss/c | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies an/en | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies an/en | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies on/om | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 14 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir les graphies on/om | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir les graphies in/ain/ein | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir les graphies in/ain/ein | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer m devant m, b ou p | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer m devant m, b ou p | production / initial | 0 | 0 / 0 (insufficient_coverage) | 26 | 1 / 8 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir é ou è — Choisir é | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir é ou è — Choisir è | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir é ou è — Choisir e sans accent | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir é ou è — Choisir é | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir é ou è — Choisir è | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir é ou è — Choisir e sans accent | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer l'accent circonflexe | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer l'accent circonflexe | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer la cédille | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer la cédille | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer le tréma | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer le tréma | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le radical d'une famille de mots | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Reconnaître le radical d'une famille de mots | production / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Justifier une lettre finale muette | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Justifier une lettre finale muette | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer une consonne doublée | recognition / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer une consonne doublée | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Orthographier un préfixe fréquent | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Orthographier un préfixe fréquent | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Orthographier un suffixe fréquent | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Orthographier un suffixe fréquent | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Orthographier un mot invariable fréquent | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Orthographier un mot invariable fréquent | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Orthographier un mot irrégulier fréquent | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Orthographier un mot irrégulier fréquent | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Maintenir l'orthographe lexicale dans une phrase | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Maintenir l'orthographe lexicale dans une phrase | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Maintenir l'orthographe lexicale dans une phrase | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Réviser l'orthographe lexicale d'un paragraphe | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réviser l'orthographe lexicale d'un paragraphe | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réviser l'orthographe lexicale d'un paragraphe | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Marquer le pluriel régulier d'un nom | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Marquer le pluriel régulier d'un nom | production / initial | 1 | 1 / 0 (insufficient_coverage) | 16 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Former le pluriel des noms en -al — Transformation -al → -aux | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -al — Exceptions en -als | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -al — Transformation -al → -aux | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -al — Exceptions en -als | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -au ou -eu — Noms en -au | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -au ou -eu — Noms en -eu | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -au ou -eu — Exceptions en -s | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -au ou -eu — Noms en -au | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -au ou -eu — Noms en -eu | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le pluriel des noms en -au ou -eu — Exceptions en -s | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le féminin régulier d'un adjectif | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Former le féminin régulier d'un adjectif | production / initial | 0 | 0 / 0 (insufficient_coverage) | 16 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Réaliser l'accord déterminant-nom | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réaliser l'accord déterminant-nom | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réaliser l'accord nom-adjectif | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réaliser l'accord nom-adjectif | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réaliser l'accord sujet-verbe — Sujet proche du verbe | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réaliser l'accord sujet-verbe — Sujet éloigné du verbe | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réaliser l'accord sujet-verbe — Sujet placé après le verbe | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réaliser l'accord sujet-verbe — Plusieurs sujets coordonnés | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réaliser l'accord sujet-verbe — Sujet proche du verbe | production / initial | 1 | 1 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Réaliser l'accord sujet-verbe — Sujet éloigné du verbe | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Réaliser l'accord sujet-verbe — Sujet placé après le verbe | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Réaliser l'accord sujet-verbe — Plusieurs sujets coordonnés | production / initial | 0 | 0 / 0 (insufficient_coverage) | 14 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir « a/à » | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « a/à » | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir la coordination ou la forme « est » | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir la coordination ou la forme « est » | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « son/sont » | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « son/sont » | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « on/ont » | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « on/ont » | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « ce/se » | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « ce/se » | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « ces/ses » | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « ces/ses » | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « ou/où » | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir « ou/où » | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | review_fixed_pair_novelty_contract | author_or_reuse_exact_target_teaching |
| Choisir une finale en -er ou -é | recognition / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Choisir une finale en -er ou -é | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Maintenir l'orthographe grammaticale dans une phrase | recognition / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Maintenir l'orthographe grammaticale dans une phrase | production / initial | 2 | 2 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Maintenir l'orthographe grammaticale dans une phrase | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Réviser l'orthographe grammaticale d'un paragraphe | recognition / initial | 3 | 3 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Réviser l'orthographe grammaticale d'un paragraphe | production / initial | 1 | 1 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Réviser l'orthographe grammaticale d'un paragraphe | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Identifier un complément direct | recognition / initial | 0 | 0 / 0 (insufficient_coverage) | 16 | 1 / 8 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer le, la, l’ ou les — le | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer le, la, l’ ou les — la | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer le, la, l’ ou les — les | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer le, la, l’ ou les — l’ devant une voyelle | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer lui ou leur — lui : une personne | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer lui ou leur — leur : plusieurs personnes | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 6 | review_exact_target_drafts | review_teaching_scope_and_content |
| Choisir entre COD et COI | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 1 / 8 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer y et en — y : un lieu | production / initial | 0 | 0 / 0 (insufficient_coverage) | 18 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer y et en — y : à + une chose | production / initial | 0 | 0 / 0 (insufficient_coverage) | 18 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer y et en — en : une origine | production / initial | 0 | 0 / 0 (insufficient_coverage) | 18 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer y et en — en : une quantité | production / initial | 0 | 0 / 0 (insufficient_coverage) | 18 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Employer y et en — en : de + une chose | production / initial | 0 | 0 / 0 (insufficient_coverage) | 18 | 1 / 4 | review_exact_target_drafts | review_teaching_scope_and_content |
| Placer un pronom complément — Avant le verbe conjugué | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 1 / 3 | map_and_review_parent_drafts | review_teaching_scope_and_content |
| Placer un pronom complément — Avant l’infinitif | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 1 / 3 | map_and_review_parent_drafts | review_teaching_scope_and_content |
| Placer un pronom complément — Dans une phrase négative | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 1 / 4 | map_and_review_parent_drafts | review_teaching_scope_and_content |
| Placer un pronom complément — À l’impératif affirmatif | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 1 / 3 | map_and_review_parent_drafts | review_teaching_scope_and_content |
| Accorder avec un COD antéposé — COD repris par un pronom | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Accorder avec un COD antéposé — COD repris par que | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Ordonner deux pronoms compléments — Dans une phrase déclarative | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Ordonner deux pronoms compléments — Dans une phrase négative | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Ordonner deux pronoms compléments — À l’impératif affirmatif | production / initial | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | map_and_review_parent_drafts | author_or_reuse_exact_target_teaching |
| Employer les pronoms compléments en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le présent de l’indicatif en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le futur proche en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le passé récent en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le passé composé en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le imparfait en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le futur simple en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le plus-que-parfait en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le conditionnel présent en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le subjonctif présent en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Employer le impératif en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer être | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer avoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer aller | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer faire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer prendre | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer venir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer partir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer sortir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer dire | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer voir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer pouvoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer vouloir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer savoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Conjuguer devoir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 8 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Verbes réguliers en -er | production / initial | 0 | 0 / 0 (insufficient_coverage) | 56 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Verbes en -ir comme finir | production / initial | 0 | 0 / 0 (insufficient_coverage) | 32 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Verbes en -ger | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Produire le passé simple — Verbes en -cer | production / initial | 0 | 0 / 0 (insufficient_coverage) | 24 | 0 / 0 | review_exact_target_drafts | author_or_reuse_exact_target_teaching |
| Employer le passé simple en contexte | independent_production / learning | 0 | 0 / 0 (insufficient_coverage) | 0 | 0 / 0 | author_missing_evidence | author_or_reuse_exact_target_teaching |

## Interpretation limits

- Material coverage lists explicit assessed identities by candidate group; configured verbs and incidental context do not satisfy required target identities. Present identities do not establish freshness, semantic independence, complete history or approval.
- Draft refinements and annotations are not approved by this report
- Parent draft candidates may appear on several rows; never sum them as unique or exact-target coverage
- Expansion drafts are not eligible questions and do not satisfy pool requirements
- Activity status refers to exact-target bindings in this candidate, not the absence of all existing lessons
- This report is a local planning artifact, not a publication or calibration decision
