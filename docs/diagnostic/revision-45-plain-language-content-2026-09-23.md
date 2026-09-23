# Revision 45 plain-language diagnostic content

## Result

Revision 45 keeps the revision 44 bank immutable and builds a new candidate, `french-diagnostic-bank-v3-r45`, from the same taxonomy. The new bank contains 8,088 questions. Its checksum is `sha256:8926a6f8cf8b788fc3463d623d2e35123963fdfa3fb19a8b9c5b38f7ba59ef02`.

Compared with revision 44, 4,346 bank items have revised instructions. The scoped student candidate uses 3,645 of those revised items across 13 skills. The changes preserve every item key, evidence key, evidence expectation, validator type, and skill binding. No controlled or short-answer `correctAnswer` or `acceptableAnswers` changed. In total, 109 multiple-choice items were intentionally rewritten: the earlier 40 sentence-completion and determiner items, plus 69 subject, sentence-structure, present-time, word-segment and direct-object items in this hardening pass. Every item still has exactly one correct choice. The completed person-number sentences were checked individually; the reviewed source now uses `Je suis près des enceintes` instead of the invalid `Je ai...`, and exercise sentences consistently begin with a capital letter. Four determiner contrasts now name the concrete following word instead of asking about a `nom`.

The content changes cover:

- 24 subject-and-verb agreement questions using six distinct forms of `aller`, `avoir`, or `être`, with an internal six-group sampling category;
- 40 determiner-choice questions and 42 written determiner questions;
- 471 present-production questions and 467 near-future-production questions;
- 2,472 production questions for the imperfect, recent past, compound past, simple future, pluperfect, conditional, and frequent subjunctive;
- 130 guarded revision-45-only assessment rewrites covering subjects, reference words, sentence order, present-time recognition, verb segments, direct objects, selected adjective and linking-word prompts, agreement, and one passive rewrite;
- 256 guided-practice prompts, 27 authored lesson titles, and 74 assessment labels across 22 nodes.

Advanced passages, source sentences, challenge ordering, evidence thresholds, and validators remain unchanged. Faceted assessment labels keep the verb or pattern suffix, including `venir`, `être`, `-ger`, and `-cer`.

## Scoped candidate

The frozen scoped candidate contains 367 assessment targets, 367 teaching targets, and 6,660 questions. It has no missing instruction target and passed publication preflight with no instruction or fresh-check gap. Its checksum is `sha256:7c2ac9aa5063c1e765e7f2afe785e4602989dacd699b719496479af9f52c0665`. The prepared publication bundle checksum is `sha256:66cd00f58e0493c591742bd94975b8015c5cc3713f9e84dee93dbfdb14316843`.

Three old probes are absent from the scoped candidate:

- `local-conjugation-gap-v1:distinguer_personne_nombre:receptive:foundation` asked for “traits personne-nombre” and used category-name choices. Twenty-four sentence-completion questions remain for the same evidence target, balanced as four questions in each of six internal groups.
- `review-draft-v1:reconnaitre_imparfait:receptive:core` had the correct answer `nous finissions` twice, once marked correct and once marked incorrect. Twelve other active imperfect-recognition probes remain.
- `review-draft-v1:reconnaitre_imparfait:receptive:stretch` had the correct answer `était` three times with conflicting correctness. Twelve other active imperfect-recognition probes remain.

The three removals therefore remove no requested verb or grammar evidence target.

## Technical wording retained for a later pass

An active prompt-and-choice scan of the 6,660 scoped questions found:

- 0 person-number nomenclature items;
- 1 use of `déterminant`, in a contrast whose assessed skill is distinguishing a demonstrative before a noun from a pronoun;
- 13 uses of `futur proche`: 8 recognition questions, 3 contextual-use questions, 1 meaning question, and 1 recent-past distractor;
- the 10 conjugation-foundation recognition prompts now use present-time cues instead of `présent de l’indicatif`; other tense-recognition families remain for their dedicated copy pass;
- 48 direct tense-naming questions: 24 simple-past recognition and 24 subjunctive recognition;
- 135 uses of `participe passé`: 37 formation, 25 infinitive-versus-participle, 36 agreement with `être`, 36 agreement with `avoir`, and 1 recent-past distractor.

These remaining terms name the form being recognized or distinguish two grammatical forms. They were retained rather than replacing an assessed naming construct with a different skill. Production directions for the same tense families now use time cues, construction cues, or short non-answer examples.

## Verification

- focused pathway, route-policy and copy tests, including revision 44 immutability and revision 45 answer-preservation assertions;
- generated expansion checks for the seven touched expansion families;
- revision 45 assembly and parallel/scoped candidate reproducibility checks;
- scoped publication preflight: ready, 0 instruction gaps, 0 fresh-check gaps;
- scoped command journeys: 60-question all-wrong and mixed profiles, both completed without a runtime failure;
- TypeScript compilation and JSON parsing;
- no publication, activation, or deployment command was run.
