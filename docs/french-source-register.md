# French foundation source, provenance, and licensing register

**Register version:** 1.1.0
**Approved:** 2026-08-06
**Owner:** SigmaWrite taxonomy steward  
**Review cadence:** before every import and at least annually

This register is an engineering control, not legal advice. “Importable” means that the recorded terms permit the intended SigmaWrite use and that the stated obligations are implemented. Missing, conflicting, or source-level-only terms always resolve to **blocked** until reviewed.

## Usage statuses

- **Importable:** listed fields may be stored and redistributed under the recorded terms.
- **Codes only:** SigmaWrite may store identifiers, original mappings, and its own descriptions, but not source prose, tables, examples, or item text.
- **Reference only:** staff may consult the source while authoring original material; no source content is copied into the product dataset.
- **Permission required:** no import or redistribution until written permission is attached to the source-version record.
- **Prohibited:** must not be used for the stated purpose.

## Approved register

| Key | Source and owner | Planned use | Status / import decision | Permitted stored fields | Terms and required attribution |
| --- | --- | --- | --- | --- | --- |
| `fr-bo-cycle3-2025` | French Ministry of National Education, Bulletin officiel cycle 3 | Native-grade progression alignment | **Codes only** | official document identifier, publication/effective dates, grade/cycle code, SigmaWrite-authored mapping and rationale | Public official curriculum, but this register does not infer a bulk-content licence. Attribute “Ministère de l'Éducation nationale, BO no 16 du 17 avril 2025,” URL, access date. Do not copy programme prose or examples. |
| `fr-bo-cycle4-current` | French Ministry of National Education, current cycle 4 programme | Native-grade progression alignment | **Codes only** | same limited mapping fields as above | Attribute ministry, exact BO/version, URL, and access date. Recheck staged effective dates before a release. |
| `fr-bo-lycee-current` | French Ministry of National Education, current lycée programme | 2de boundary alignment | **Codes only** | programme identifier, year/grade code, SigmaWrite-authored mapping and rationale | Attribute ministry, exact programme/version, URL, and access date. No copied source prose. |
| `coe-cefr` | Council of Europe, CEFR and Companion Volume | FSL/CEFR progression alignment | **Codes only** | level code, scale identifier, SigmaWrite-authored paraphrase, mapping confidence and rationale | CEFR copyright belongs to the Council of Europe. Citation is permitted; reuse of scales/publication material requires permission. Attribute publication title, Council of Europe, year, URL. No copied descriptors or scale tables. |
| `lexique-3` | Boris New and Christophe Pallier, Lexique 3.x | Lemmas, forms, grammatical attributes, book/film frequency | **Permission required** | none until a signed commercial-use permission and exact dataset/version checksum are registered | Official pages currently describe Creative Commons terms inconsistently and at least one states NonCommercial. Treat as non-commercial-only and blocked for SigmaWrite production. Citation alone does not cure the restriction. |
| `lexique-4` | Boris New, Christophe Pallier, Gauvain Schalchli, Jessica Bourgin, Manuel Gimenes, and contributors, Lexique 4.00 | Lemmas, forms, grammatical attributes and subtitle-corpus frequency | **Importable as a separately governed CC BY-SA lexical release** | lemma, form, part of speech, frequency | Official release page and bundled README identify CC BY-SA 4.0. Commercial reuse is permitted. Preserve attribution, source and licence links, mark transformations, and distribute shared adapted lexical material under CC BY-SA 4.0-compatible terms without DRM. Do not represent frequency as child-directed. Do not redistribute the mixed operational database; export this lexical release separately with its licence manifest. |
| `emanulex` | Bernard Lété et al., Manulex / Manulex-infra | Child-directed lemma and word-form frequency | **Prohibited for commercial production; permission required for any exception** | none | CC BY-NC-SA 3.0 per the official download page. Written permission is required for use outside that licence. |
| `lefff` | Original Lefff rights holders / INRIA distribution | Morphology and inflected-form coverage | **Permission required** | none until the precise distribution, LGPLLR text, attribution, redistribution, and database-combination implications are reviewed and recorded | Do not rely on third-party summaries. Attach the authoritative licence supplied with the exact downloaded artifact before approval. |
| `wiktionary-fr` | Wiktionary contributors / Wikimedia Foundation | Candidate senses, forms, relations, examples | **Reference only for v1** | source URL may appear in an authoring note; no imported entries or examples | CC BY-SA and database/attribution obligations require a deliberate share-alike distribution design. Do not import into the mixed v1 lexical release. |
| `language-tool` | LanguageTool project | Runtime grammar/style signal | **Tool only; no corpus import** | validator version, rule identifier, locale, offsets, category, result | Store validator outputs and version metadata, not LanguageTool dictionaries/corpora. Software deployment remains governed by the dependency/distribution licence review. |
| `sigma-original-taxonomy` | SigmaWrite | Competency, construction, concept, mapping, evidence, misconception, and template records | **Importable** | all original structured fields | “© SigmaWrite, French Taxonomy release {release_version}.” Records must identify human/generated origin, author/reviewer, and source inspirations separately. |
| `sigma-original-pilot-corpus` | SigmaWrite | Baseline lemma/form coverage and corpus-specific pilot frequency | **Importable** | normalized tokens, authored lemma/form mappings, part of speech, document partition, counts, derived frequency | Original SigmaWrite-authored passages under `Proprietary-SigmaWrite-v1`. Attribute “© SigmaWrite, corpus pilote français {version}.” Frequency is labelled as pilot-corpus frequency and never presented as general French population frequency. |
| `sigma-generated-content` | SigmaWrite generation pipeline and contracted model providers | Passages, questions, explanations, assessment candidates | **Importable after QA** | generated artifact, prompt/model stamps, contract, QA, provenance and review records | Provider terms must permit product use. Never label generated content as a curriculum-source quotation. Preserve provider/model and prompt provenance. |
| `public-domain-fr-text` | Work-specific author/publisher source | Grounded excerpts or evaluation fixtures | **Permission required per work** | only fields and text covered by documented public-domain determination | Record author death/jurisdiction analysis, edition/source, transcription rights, verification owner and date. “Old” is not sufficient evidence. Modern editions, translations, annotations, and scans may carry separate rights. |
| `commercial-textbook` | Any commercial publisher or test vendor | Curriculum examples, passages, exercises, answer keys | **Prohibited** | bibliographic citation only when necessary | No scraping, transcription, paraphrase-close substitution, model training set, benchmark fixture, or generated derivative. Written licence and a new register decision are required. |
| `student-or-teacher-upload` | End user or their institution | Topic inspiration or classroom context | **Prohibited as taxonomy/lexicon source** | minimal user content only under product retention policy; never foundation records | User possession does not establish redistribution rights. Do not add uploads to releases, prompts, benchmarks, or reusable generated content. |

Primary terms checked for this decision include the [Council of Europe permissions policy](https://www.coe.int/en/web/portal/copyright-licensing-permissions), the [official Manulex download terms](https://www.manulex.org/fr/downloads.html), the [Lexique project site](https://www.lexique.org/), and the [French Open Licence 2.0](https://www.data.gouv.fr/pages/legal/licences/etalab-2.0). A link is evidence of the review location, not a substitute for storing the exact terms and artifact checksum at import time.

### Lexique 4.00 approval record

- Artifact: `https://lexique.org/databases/Lexique400/Lexique400.tsv`, retrieved 2026-08-06.
- TSV SHA-256: `fe333b4f9e1797f23922d5863cde28635ee13685813af0f9b4b4b9f7d4610a5a`.
- Official archive SHA-256: `8ed5a64373ae798f0485a2a35848c09286b6694c6859abeaab6806594c046993`.
- Official README SHA-256: `c235151260e7c26d0115331ed417c943c8f8d10d6844f59b5d7f9b1da6b70a26`.
- Licence: `CC-BY-SA-4.0`; canonical legal-code SHA-256 `28a9529c7d0bb4dc51f4bf5c116a3d16ef247a052f7591466768ddf563fd1cf5`.
- Approved release: `sigma-french-lexique4@4.00.1`, a frequency-ranked 2,005-lemma / 19,374-form subset with required held-out forms.
- Release content SHA-256: `27db3978cb462a57de5b14fef1e096eb30c42c90e6a80aa2dfd3a2ffe84cf3dc`; the builder pins the recorded source-retrieval timestamp so the same snapshot reproduces this hash.
- Validation: 51/52 held-out tokens known, 98.08% coverage. The sole unknown token is the tokenizer compound `l'idée`; this is above the 95% gate without manually inflating coverage.
- Distribution decision: the lexical release and its export manifest are CC BY-SA 4.0 material. SigmaWrite application code, original pedagogy, private learner data, and operational tables are not part of the lexical export. A redistribution must include the recorded attribution, licence URL, source URL, checksums, and transformation notice.
- Approval trail: source version and release approved/published in isolated staging by the existing `Jean-Philippe Kayobotsi` platform-admin profile on 2026-08-06. This register records an engineering rights decision under a standard public licence and is not a substitute for counsel on a disputed or novel interpretation.

## Codes-only and full-text policy

For curriculum and CEFR sources, SigmaWrite stores only stable external identifiers and original SigmaWrite mappings. Labels, descriptions, evidence statements, examples, and progression rationales in the taxonomy must be independently written. A short quotation may appear in an internal review note only when legally permitted, necessary, attributed, and excluded from release exports.

Full text may enter a distributable release only when the source-version record contains:

1. the exact licence or written permission;
2. artifact URL, retrieval time, version and checksum;
3. permitted fields and purposes;
4. attribution and redistribution requirements;
5. a compatibility decision for the target release;
6. an accountable approver.

## Required provenance chain

Every imported or mapped record must resolve relationally to:

```text
record → source_version → source → rights_decision
                         → artifact checksum
                         → attribution template
                         → import run and transformation version
```

Generated and derivative records additionally retain their input record identifiers, transformation/prompt version, provider/model when applicable, reviewer, and creation time. Deleting or replacing a source never rewrites a published release; a later release records the correction.

## Attribution templates

- **French ministry mapping:** `Alignment authored by SigmaWrite with reference to {document title}, Ministère de l'Éducation nationale, {BO identifier/date}, {URL}, accessed {date}. No endorsement implied.`
- **Council of Europe mapping:** `SigmaWrite-authored alignment referencing {publication title}, Council of Europe, {year}, {URL}, accessed {date}. CEFR descriptors are not reproduced.`
- **Licensed dataset:** `{dataset title} {version}, {rightsholder}, {licence identifier and link}, retrieved {date}; transformed by SigmaWrite using {importer version}.`
- **Written permission:** `{dataset title} {version}, used under written permission from {rightsholder} dated {date}; restrictions: {summary}; permission record {id}.`
- **SigmaWrite original:** `© SigmaWrite. Record {stable_key}, authored/reviewed {dates}, published in French Taxonomy {release}.`

Attribution required by a source must be emitted in release manifests and any redistributed dataset, not only kept in an internal database.

## Derivative and generated-data obligations

- Source restrictions follow copied or transformed source data when the licence says they do; normalizing spelling or changing columns does not erase them.
- Statistical facts may still be protected as part of a database. Frequency values are not imported without database-use permission.
- A model output is not presumed independent when prompts contain protected passages, items, examples, or tables. Prohibited source material must never be inserted into generation prompts.
- SigmaWrite-authored mappings that merely cite external codes remain separate from the external source and must not reproduce protected wording.
- Share-alike and non-commercial sources are not mixed into the production release unless an approved distribution and business-use decision explicitly satisfies those terms.

## Prohibited-source list

The following are prohibited unless this register is amended with documented rights:

- commercial textbooks, workbooks, teacher guides, test-preparation banks, and exam-vendor items;
- scraped paywalled or access-controlled content;
- copyrighted novels, news articles, subtitles, fan fiction, song lyrics, and modern translations used as passages or close paraphrase sources;
- datasets with absent, conflicting, unverifiable, non-commercial, or incompatible share-alike terms;
- student/teacher uploads as reusable foundation or benchmark content;
- outputs whose provider terms or training-data restrictions do not permit the intended use;
- the Marble taxonomy dataset for translation or wholesale import; its modelling approach may be studied, but French taxonomy records must be original and independently sourced.

## Adding or changing a source

1. Create a candidate source entry with owner, exact artifact/version, intended fields, intended commercial and redistribution uses, and responsible steward.
2. Save the authoritative terms or permission, URL, retrieval timestamp, and checksum. Marketing summaries and third-party licence claims are insufficient.
3. Classify the decision as importable, codes only, reference only, permission required, or prohibited; document database, derivative, attribution, share-alike, privacy, and model-use obligations.
4. Obtain product/data-owner approval and legal review for ambiguity, non-standard terms, personal data, non-commercial clauses, share-alike combinations, or copyrighted full text.
5. Implement provenance and attribution before the importer can run. Importers must require an approved source-version identifier and fail closed otherwise.
6. Validate a sample, produce counts/checksums, and record the import run. Reviewers confirm that only permitted fields entered the release.
7. A licence, artifact, source URL, or intended-use change creates a new source version and requires a new decision; it never silently changes prior release provenance.

## Immediate enforcement decisions

- The existing `scripts/import-lexique.mts` remains a development-only Lexique 3 artifact and is **not approved for production execution**. Lexique 4 must use `scripts/build-lexique4-release.mts` followed by the governed baseline importer and exact licence snapshot.
- V1 taxonomy authoring may proceed using original SigmaWrite records and codes-only curriculum/CEFR mappings.
- Lexique 4.00 is approved only for the separately governed `sigma-french-lexique4` release under the obligations above. The v1 original baseline remains separately labelled as pilot-corpus frequency.
