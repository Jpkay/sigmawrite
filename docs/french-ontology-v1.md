# French ontology v1 decision record

**Decision:** approved for implementation  
**Scope:** SigmaWrite French foundation v1  
**Owners:** product, French pedagogy, and platform engineering  
**Change policy:** changes to meanings in this record require a new ontology version and a migration assessment

## Purpose

SigmaWrite uses one shared, versioned French learning foundation with separate learner-progression overlays. The ontology defines instructional meaning; generated content may express that meaning but may not redefine it.

## Graph layers and boundaries

| Layer | Represents | May contain | Must not contain |
| --- | --- | --- | --- |
| Competency | An observable learner capability | concepts, procedures, linguistic operations, representations, metacognition | topics, course navigation, or a learner's current score |
| Lexical | French words and their meanings | lemmas, senses, forms, families, collocations, register and frequency | a single unexplained difficulty rank or duplicated surface forms as unrelated words |
| Construction | Reusable organization of French | syntax, agreement, reference, cohesion, tense/mood/aspect and discourse use | vocabulary senses or broad reading outcomes |
| Content concept | Knowledge assumed by a passage | concepts, topic aliases, prerequisites, familiarity and risk | French-language competencies |
| Learning package | Finite product pathways | lessons, modules, courses and versioned membership | the source of truth for mastery |
| Student overlay | Time-varying learner state | mastery, uncertainty, evidence, readiness, schedules and completion events | changes to the shared graph |
| Content/evidence | Immutable instructional and response records | passages, questions, contracts, attempts and QA results | silent edits to published graph or answer keys |

Concepts may be linked across layers with typed mappings, but they are never merged merely because they appear in the same activity. For example, knowledge of *la photosynthèse* is a content concept; resolving the causal connector *donc* is a construction-backed reading competency.

## Atomic competency rule

An atomic competency is the smallest capability for which SigmaWrite can collect interpretable evidence and choose a targeted next action.

It must have:

1. one observable learner action;
2. one principal modality (reading, listening, speaking, or writing);
3. one receptive or productive expectation;
4. a bounded linguistic or reasoning demand;
5. positive and negative evidence examples;
6. no hidden conjunction of independently teachable capabilities.

Words such as “understand,” “know,” or “master French” are not sufficient without an observable action. A node that requires both recognizing a form and producing it is split. A broad outcome such as “understand a narrative” is decomposed into evidence-bearing nodes such as locating explicit information, resolving reference, ordering events, and interpreting tense contrast.

## Node identity and naming

- Stable keys use a layer/strand/action convention and do not encode grade, CEFR level, learner mode, or release version.
- French labels use an infinitive observable action, for example *Résoudre la référence d'un pronom sujet*.
- Identity follows pedagogical meaning, not wording. Renaming a label does not create a new node; changing the observable capability does.
- Recognition, controlled production, and independent connected-text use are separate nodes when their evidence differs.
- Modality is explicit. Reading recognition is not evidence of writing production unless a reviewed evidence rule links them.

## Edge semantics

All edge directions read from `source` to `target`.

| Edge | Meaning of `source → target` | Structural rule |
| --- | --- | --- |
| `prerequisite_hard` | source must be sufficiently mastered before target is normally taught or assessed | blocks readiness; must be acyclic |
| `prerequisite_soft` | source improves success on target but is not mandatory | affects ranking, never independently blocks |
| `part_of` | source is an instructional component of target | does not imply mastery inheritance |
| `supports` | evidence on source is relevant supporting evidence for target | bounded evidence transfer only |
| `contrasts_with` | source and target are pedagogically clarified by comparison | symmetric in meaning; stored canonically once |
| `commonly_confused_with` | learners commonly substitute or confuse source with target | symmetric in meaning; never a prerequisite |
| `lexical_relation` | source sense has the declared lexical relationship to target sense | relation subtype is mandatory |
| `maps_to` | source corresponds to an external curriculum code or product package | not a prerequisite and not mastery evidence |
| `requires_concept` | a language/content target assumes the source content concept | affects explanation and grounding policy |

Every prerequisite edge records a rationale, hard/soft class, provenance, and review state. Cycles and self-loops are invalid for prerequisite edges.

## Learner progression overlays

Universal French capabilities exist once. L1, FSL/L2, heritage, bilingual, allophone-support, and immersion overlays may independently specify:

- expected introduction and consolidation ranges;
- receptive versus productive expectation;
- prerequisite emphasis and instructional route;
- evidence quantity, modality, and confidence requirements;
- vocabulary exposure assumptions;
- curriculum codes and uncertainty.

An overlay never duplicates a competency. Native grade and CEFR are separate mappings and must not be converted through a fixed equivalence. Heritage and immersion profiles may combine overlay rules per strand rather than receiving one harmonized level.

## Conjugation modelling

Conjugation is represented across separable evidence-bearing dimensions:

- person/number and subject identification;
- verb family and regular/irregular formation;
- auxiliary choice and past-participle agreement;
- recognition versus controlled or independent production;
- tense/mood/aspect form versus temporal meaning;
- isolated sentence use versus chronology and discourse effect in connected text;
- modality: oral recognition/production, reading, and writing.

For example, “recognize an *imparfait* form,” “produce regular *imparfait* forms,” “interpret background or habitual meaning,” and “contrast *imparfait* with *passé composé* in narration” are distinct nodes connected by explicit prerequisites. Success on one does not silently set the others to mastered.

## Initial product scope

V1 targets ages 11–16, approximately native French grades 6e–2de and FSL/CEFR A1–B2. These ranges identify the pilot envelope, not equivalence between grade and CEFR.

The first publishable foundation covers:

- reading: explicit information, reference, vocabulary in context, main idea, structure, local inference, summary, viewpoint, argument and textual evidence;
- constructions: sentence and clause structure, coordination/subordination, pronouns and reference chains, negation, agreement, connectors and discourse relations;
- conjugation: présent, futur proche, passé récent, passé composé, imparfait, their narrative contrast, receptive passé simple, futur simple, plus-que-parfait, conditionnel présent, introductory subjonctif présent, imperative, common non-finite forms, and connected-text temporal sequencing;
- lexical constraints sufficient for versioned passage coverage analysis;
- low-risk fictional and grounded informational pilot topics.

Mappings outside these ranges may be stored as provisional but cannot be presented as validated v1 coverage.

## V1 non-goals

- claiming a universal grade-to-CEFR conversion;
- complete coverage of advanced literary and compound tenses;
- open-domain chat or unconstrained student-directed generation;
- automatic curriculum or graph changes from production telemetry;
- diagnosis of dyslexia, language disorders, or other clinical conditions;
- treating course completion, percentile, predicted success, and durable mastery as the same measure;
- allowing a learning package to redefine an atomic competency;
- importing source text or fields before rights and attribution are recorded.

## Classification calibration set

Reviewers classify an example by its observable target, not by the activity in which it appears.

| # | Example | Classification | Reason / edge case |
| --- | --- | --- | --- |
| 1 | Identify the explicit location stated in a paragraph | competency: reading, receptive | one observable retrieval action |
| 2 | Resolve what *il* refers to across two sentences | competency linked to construction: reference chain | not merely “pronouns” vocabulary |
| 3 | *équipage* meaning “crew of a ship” | lexical sense | distinct from another sense or surface form |
| 4 | plural form *équipages* | lexical form of the sense-bearing lemma | not a separate vocabulary competency |
| 5 | Recognize a regular *imparfait* form in reading | construction/conjugation competency: receptive form | separate from meaning and production |
| 6 | Explain why *imparfait* sets the scene while *passé composé* advances events | construction/conjugation competency: discourse meaning | requires form prerequisites but is not the same mastery value |
| 7 | Produce correct *passé composé* with *être* and agreement | construction/conjugation competency: written production | auxiliary and agreement are explicit prerequisites |
| 8 | Photosynthesis | content concept | background knowledge, not French mastery |
| 9 | “Narrating in the past” course | learning package | groups nodes; never stores mastery itself |
| 10 | CEFR B1 expectation for interpreting chronological connectors | progression-overlay mapping | mapping does not create a B1-specific duplicate node |
| 11 | Compare two viewpoints and cite evidence | split into compare-viewpoints and justify-with-evidence competencies | hidden conjunction; too broad as one atomic node |
| 12 | *car* causes an explanatory relation in a passage | construction instance/evidence annotation | the reusable relation is a construction; this occurrence is content evidence |

## Governance and review

- Two reviewers independently classify calibration or disputed examples; disagreements are resolved against this record and documented.
- New node and edge types require an ontology-version decision before schema or content changes.
- Mapping uncertainty is explicit (`provisional`, confidence, evidence note); it is never hidden by choosing a convenient level.
- Published releases preserve their ontology version and are immutable. Corrections are issued in a later release with a compatibility note.
