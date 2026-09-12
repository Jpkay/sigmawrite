# Verb-family recognition draft

The approved French node classer_famille_verbale currently lacks a complete question pool. This standalone expansion now supplies 36 original MCQs, expanded from the first 24: twelve regular -er verbs, twelve verbs following finir, and twelve other verbs. Each question supplies the infinitive and first-person singular/plural present forms. It assesses recognition, not conjugation production.

Three draft refinements keep those patterns separate under the approved parent. An isolated engine test answers only the -er questions correctly across two occasions; that target becomes mastered while the other two remain unknown. The parent's evidence thresholds are retained. These refinements require an explicit authoring option and are not part of default compilation or a published release.

Three matching lessons include 18 guided exercises in total. Each has four examples of its main pattern and two contrasting examples. Supplied model words, examples and guided verbs are separate from the 36 quiz verbs. The lessons explain that recognising a model does not establish unaided conjugation or mastery of every irregular verb and tense.

Choices name chanter and finir instead of numbering groups. Aller includes je vais as well as nous allons. Classification reference: [OQLF, Verbes réguliers et irréguliers](https://vitrinelinguistique.oqlf.gouv.qc.ca/24654/la-grammaire/le-verbe/conjugaison/verbes-reguliers-et-irreguliers). Questions and teaching text are original.

The material annotation retains all displayed text, including the recurring answer labels. The assessed material is the question's own verb and prompt. This avoids confusing shared category labels with a previously taught question. It does not certify complete learner history or establish a new novelty rule.

Validation: generation gates, canonical-bank validation and anchored material checks passed. Five focused tests cover honest review status, default-assembly isolation, contrasting forms, unique visible items, source-preserving facet refinement, evidence separation, exact lesson binding and question allocation. Each isolated target has six initial questions and six learning questions; assessed material in those learning questions does not overlap its lesson. TypeScript passed. This is authoring validation, not human review or classroom calibration.

Release state: draft_requires_review. The question expansion and teaching/refinement definitions remain absent from default assembly while revision 35 is importing. Its frozen 7,820-item bank is unchanged, and the prepared release scope remains 344 targets. Full-candidate integration, prerequisite routing, publication checks and learning journeys are still required for a later revision.

Compatibility preparation: buildV3Facets accepts an explicit verbFamilyRecognition option. Default compilation remains at 542 targets; selecting the three-way refinement produces 544. Release validation accepts the complete new split, rejects partial/invented/mixed parent-and-child records, and retains older unsplit releases. The release identity changes with the selected refinement. This support does not yet wire the new question and lesson sources into full-candidate assembly.

Validation after compatibility support: 385 test files / 1,702 tests passed and TypeScript passed. Read-only production-store validation successfully loaded releases 20, 34 and 35, each with its original 542 targets and one unchanged family-recognition parent. No database writes. Evidence: verb-family-published-compatibility-2026-09-12.json.
