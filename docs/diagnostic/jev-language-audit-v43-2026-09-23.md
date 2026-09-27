# Jev language audit: French diagnostic and lesson copy

Date: 2026-09-23

## Snapshot and scope

This audit used the runtime-validated export of the promoted/default French granular diagnostic release v43:

- Release id: `b6f62722-c913-4d64-9ffd-59027eefc73b`
- Release checksum: `sha256:10b4009e59acb78cefe2890d609caec6e83033d9416002be6b027de3a7a102de`
- Snapshot: `tmp/jev-published-v43-bundle.json`

The snapshot is evidence about that named release, not a live database query. Re-export before a later audit if the promoted release changes. The published bundle was never edited. All changes in this patch are source candidates for a future generated and published release.

Three separate scopes were evaluated:

| Scope | Source | Records | Purpose |
| --- | --- | ---: | --- |
| Diagnostic and guided exercise directions | Published v43 snapshot | 8,759 | Check whether a learner can understand what to do without already knowing incidental grammar jargon |
| Lesson prose | Published v43 snapshot | 6,858 | Check explanations, takeaways, boundaries, hints, and feedback without lowering the grammar concept |
| Shared diagnostic UI copy | Static source | 120 | Check labels, headings, feedback, and controls as isolated UI strings |

The UI audit excludes 15 accent-pad glyphs such as `é` and `’`. They are input controls rather than prose. Static UI copy is not presented as published release content.

## How Jev was used

Each distinct instruction was sent to TypeSafe's `jev-latest` model with three Noul questions in one request:

1. Is the requested action clear to a French-speaking grade-5 reader?
2. Does understanding the direction require unexplained grammar jargon?
3. Is incidental vocabulary a barrier?

Lesson prose used parallel questions about plain-language comprehension, unexplained terms, and incidental vocabulary. Quoted examples, answer values, reading passages, and exercise sentences were excluded when their structure could be identified. Exact source text and source IDs remain in the report.

The route uses the largest relevant risk signal:

- `pass`: below 0.40
- `review`: 0.40 to below 0.75
- `likely_rewrite`: 0.75 or above

These Noul values and routes are triage signals. They are not a validated French grade-5 reading score and are not measured probabilities of student difficulty. The three Noul values are independent and do not add to 1. The 0.40 review threshold intentionally over-includes named target terms so they reach a content reviewer. TypeSafe documents that Jev is strongest in English and has lower accuracy in other languages, so passing French samples still need spot checks.

## Published snapshot results

### Diagnostic and guided exercise directions

| Surface | Pass | Review | Likely rewrite | Total |
| --- | ---: | ---: | ---: | ---: |
| Diagnostic items | 1,116 | 4,442 | 1,105 | 6,663 |
| Guided lesson exercises | 384 | 1,264 | 448 | 2,096 |
| **Total** | **1,500** | **5,706** | **1,553** | **8,759** |

The report contains 1,629 distinct flagged templates after deduplication. A high flag count is expected because many items explicitly assess whether the learner knows a named form such as *passé récent*, *participe passé*, or *subjonctif*. Those families need assessment-design review rather than automatic paraphrasing.

### Lesson prose

| Field | Pass | Review | Likely rewrite | Total |
| --- | ---: | ---: | ---: | ---: |
| Title | 69 | 298 | 0 | 367 |
| Learner question | 200 | 167 | 0 | 367 |
| Step explanation | 140 | 621 | 443 | 1,204 |
| Takeaway | 26 | 90 | 251 | 367 |
| Boundary | 10 | 108 | 249 | 367 |
| Practice hint | 269 | 824 | 1,003 | 2,096 |
| Practice explanation | 321 | 806 | 963 | 2,090 |
| **Total** | **1,035** | **2,914** | **2,909** | **6,858** |

The scan evaluated 4,438 unique Jev states after exact-state deduplication and completed with no pending or failed records. Titles and learner questions are capped at `review` because the adjacent lesson may explain a term that is unclear in isolation. Practice answer/example text is excluded where the structure is identifiable; its vocabulary is not a reason to simplify the exercise itself.

The largest reusable feedback template was the 120-occurrence `Le groupe « … » est la forme demandée dans cette construction.` (risk 0.79). It was changed in source to `Il fallait écrire « … ».` (risk 0.31). Other repeated high-risk families rely on target vocabulary such as *COD*, *participe passé*, *subjonctif*, or conjugation endings and need review with the surrounding lesson rather than an isolated replacement.

### Shared diagnostic UI copy

| Pass | Review | Likely rewrite | Total | Excluded non-prose controls |
| ---: | ---: | ---: | ---: | ---: |
| 69 | 48 | 3 | 120 | 15 |

After two source fixes, the remaining likely-rewrite UI strings are the contextual labels `Cas avec avoir et un complément direct`, `Cas avec être, sans complément direct`, and `Conjugaison`. They remain for product and content review because their meaning depends on the surrounding result display.

## Source fixes validated with Jev

The counts below describe changed source occurrences or mapped v43 lesson occurrences. They do not change the immutable v43 result counts above.

### Diagnostic and guided directions

| Family | Occurrences changed | Before risk | After risk | Result |
| --- | ---: | ---: | ---: | --- |
| Negation question | 1 | 0.81 | 0.19 | Explained the meaning instead of requiring *négation simple* |
| Relative-clause question | 1 | 0.83 | 0.28 | Explained what `dont` does instead of requiring *relative* |
| Subjunctive meaning prompt | 30 | 0.76 | 0.19 | Removed `choix du mode` while preserving the answer set |
| Compound auxiliary choice | 86 | 0.56 | 0.18 | Asked for the missing form of `avoir` or `être` |
| Subject–verb agreement choice | 64 | 0.54 | 0.11 | Asked for the form that completes the sentence |
| `être` participle practice | 18 | 0.80 | 0.22 | Replaced *participe au masculin singulier* with *forme de départ* |
| Object-pronoun production | 56 | 0.59 | 0.18 | Asked learners not to repeat the named words |

Answer keys, validators, and target bindings are unchanged in these families.

### Lesson prose

| Family | Mapped v43 occurrences changed | Before risk | After risk |
| --- | ---: | ---: | ---: |
| Passé-simple explanation and takeaway | 28 | 0.77 / 0.92 | 0.30 / 0.20 |
| Conjugation feedback `La forme attendue…` | 108 | 0.48 | 0.31 |
| Compound-tense `avoir` table explanation | 20 | 0.91 | 0.28 |
| Infinitive/participle practice hint | 18 | 0.90 | 0.23 |
| Passé-récent construction explanation | 15 | 0.84 | 0.22 |
| Double-pronoun feedback | 18 | 0.89 | 0.18 |
| Compound-tense lesson boundary | 28 | 0.82 | 0.34 / 0.38 |
| Passé-récent takeaway | 15 | 0.87 | 0.27 |
| Passé-récent apostrophe explanation and boundary | 30 | 0.76 / 0.78 | 0.36 / 0.28 |
| `sortir` auxiliary-choice hint | 12 | 0.93 | 0.30 |
| Compound-tense practice feedback | 120 | 0.79 | 0.31 |

Practice answer keys, validators, and target bindings are unchanged. The compound-tense boundary uses `j’ai cueillies` in passé-composé lessons and `j’avais cueillies` in plus-que-parfait lessons.

### Shared UI

| Field | Before | After | Risk change |
| --- | --- | --- | ---: |
| `consolidateDescription` | `Consolider cet acquis.` | `Encore un peu d’entraînement.` | 0.76 → 0.13 |
| `status.fragile` | `À consolider` | `Encore à travailler` | 0.78 → 0.34 |

### Student-visible correctness fixes

Three source exercises had `ne` before a vowel. They now use the required elision: `Vous n’envoyez…`, `Nous n’apportons…`, and `Ils n’envoient…`. Diagnostic source/prompt, guided prompt, and material exposure were corrected. Answers and validators did not change. The 180-item pronoun-order draft artifact and derived checksum were regenerated.

## Items kept for content-design review

These high-impact families were not changed automatically because the flagged term is part of the construct or response target:

| Family | Representative occurrences | Reason |
| --- | ---: | --- |
| Named-tense production, including passé récent | 224 | The tense name specifies what to produce; defining it in the prompt can cue the answer |
| Past-participle production | 36 | *Participe passé* names the form being assessed |
| Mode-and-tense identification | 24 | The grammar labels are the response target |
| Named-tense recognition | 12 | Replacing the tense name changes the recognition task |
| Subjunctive production explanations and boundaries | 14 per repeated field | The term is the lesson concept; a plain copy change still scored high and may need a redesigned explanation sequence |
| Determiner/adjective and compound-tense recognition hints | Repeated lesson families | The terms are central to what the lesson teaches; revise with the surrounding example rather than as isolated copy |

## Reproduce the audit

Refresh the named release snapshot first:

```sh
node --conditions=react-server --import tsx scripts/export-published-granular-bundle.mts <release-key> <new-output-path>
```

Run the three resumable audits:

```sh
npm run audit:instructions:jev -- --source published-bundle --bundle <bundle-path> --concurrency 32 --cache output/jev-instruction-cache.json --out output/jev-instructions
npm run audit:lesson-prose:jev -- --bundle <bundle-path> --concurrency 64 --cache output/jev-lesson-prose-cache.json --out output/jev-lesson-prose
npm run audit:diagnostic-ui:jev -- --concurrency 16 --cache output/jev-ui-cache.json --out output/jev-ui
```

Use `--dry-run` to inspect extracted text without API calls. Use `--cache-only` to export an interim or final report without calling Jev. Cache writes are atomic and periodic, so an interrupted run can resume without discarding completed evaluations. The API key is loaded from `.env.local` and is never included in the reports.

Raw JSON/CSV results stay in ignored `output/`. The reviewable source-fix evidence is recorded in `docs/diagnostic/jev-instruction-copy-fixes-v43-2026-09-23.json`.

## Verification and release status

Final checks completed:

- 15 focused test files, 48 tests passed.
- TypeScript completed with `tsc --noEmit`.
- Auxiliary-choice, subject–verb, pronoun, and pronoun-order generators passed `--check`.
- JSON parsing and `git diff --check` passed.
- Authenticated instruction, lesson-prose, and shared-UI scans completed with no pending records.

These edits are source candidates only. Learners will continue to see the published v43 wording until the affected generated artifacts are assembled, reviewed, and promoted as a new release.
