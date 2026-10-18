# Word memory (roadmap 2026-10, Phases A–C)

A word is a **lexical sense** (`lexical_senses`). A student who learns a sense has
**two FSRS cards** in `learning_retrieval_schedules` (`target_type = 'lexical_sense'`,
`facet = 'spelling' | 'meaning'`). A word is *Maîtrisé* only when both traces are
secured by spaced, unaided recall (`wordStatus`, B.2). Exposure, look-ups and
recognition never move a word past *En route*.

All server functions take a **service-role** client. Authenticate first
(`requireRole(["student"])` + `requireStudentLearningUnlocked`), then call.
Students can read their rows (RLS) but every write goes through service-only RPCs.

## Interfaces for Phase D (`server.ts`)

| Need | Call |
| --- | --- |
| Today's due cards, caps applied, plus words to introduce | `getDueWordCards(db, studentId, { now? }) → DueWordPlan` |
| Introduce a word (creates both cards, first review tomorrow) | `introduceWord(db, { studentId, senseId, at?, importance?, context?: { sentence, interest }, occurrenceKey? })` |
| Record one review answer | `recordWordReviewAttempt(db, { studentId, senseId, format, correct, accentOnly?, hintLevel?, answerRevealed?, responseMs?, novelContext?, facets?, source?: 'review' \| 'embedded' \| …, occurrenceKey, at? })` |
| Word met in other content (D.6) | same call with `source: 'embedded'` (or `recordWordEvidence` with a resolved `WordTarget`) |
| Status for display | `computeWordStatuses(db, studentId, itemIds)` or read `student_word_mastery.word_status`; labels in `WORD_STATUS_LABELS` (`word-status.ts`) |
| In-session relearning (C.4) | `relearning.ts`: `emptyRelearningQueue`, `recordSessionAttempt`, `nextRelearningItem` (pure, serialisable) |
| Grade a typed answer | `gradeSpelling(answer, expected)` → `exact \| accent \| near \| wrong` (`grading.ts`). Pass `correct: outcome === 'exact'`, `accentOnly: outcome === 'accent'`. |

`DueWordPlan` = `planWordDay` output: `reviews` (ordered, ≤ cap, each with `word`,
`definition`, `facet`, `retrievability`, `overdueFactor`), `newWordAllowance`,
`toIntroduce` (with the sentence where the word was first met), `paused`, `holiday`,
`rampActive`, `reasons`. Due counts are for internal planning only: never show
"N overdue" to the student (rule 4).

### Rules the API already enforces

- **First attempt of the day** updates FSRS (`countsForFsrs`); retries and repeats are
  logged in `word_review_log` with `counts_for_fsrs = false`. The introduction day
  counts as already touched.
- **Grade caps (B.4)** `ratingForAttempt`: wrong or answer shown → Again; accent slip →
  Hard; hint → Hard (Good if only the first letter, `hintLevel = 1`); recognition formats
  → Hard; slow answers lose one level (never become a lapse). Hint levels follow the
  practice ladder: 0 none, 1 first letter, 2 clue, 3 answer shown.
- **Formats decide the trace** (`FORMAT_CREDIT` in `types.ts`): `type_from_definition`
  proves both; `hear_and_type`, `gap_fill_typed`, `mini_dictation` spelling;
  `explain_own_words`, `judge_usage`, `synonym_antonym`, `odd_one_out` meaning;
  `pick_spelling`, `pick_definition`, `rebuild_letters` are recognition (weak credit).
  Pass `novelContext: true` when the sentence is new to the student (meaning rule).
- **Spelling is shared by every sense** of a lemma; meaning needs the exact sense.
- **Idempotency**: every write is keyed by `occurrenceKey` (unique per student). Use a
  stable key per attempt, e.g. `review:<sessionId>:<position>`.
- **Retention** 0.90 while learning, 0.85 once *Ancré*; intervals up to 1825 days, fuzz on.
- **Parameters**: per student → per age group → FSRS-6 defaults (`fsrs-params.ts`).

## Evidence capture (A.4, `capture.ts`)

`captureReadingExposure`, `captureDictationEvidence`, `captureTypedAnswerEvidence`
(practice, diagnostic), `captureFreeWritingEvidence` (productions, summaries). All are
best-effort (`safely`): failures go to monitoring and never block the student. Only
words with a vetted definition (an approved sense) are tracked.

## Planning and calendar (C.5)

`calendar.ts` holds French zones A/B/C (2025-26, 2026-27) and custom periods;
`student_memory_settings` stores the zone, custom holidays, the holiday pause option
and per-student caps. `daily-plan.ts` caps reviews (15/day) and new words (3–6/day,
3 the first week, lower when reviews pile up or success < 75 %), and orders due cards
by `(1 − R) × importance` (+ urgency for learning cards more than one interval late).

## Jobs

- `/api/jobs/word-memory-report` (Mondays): weekly calibration, 30/90-day retention per
  trace, reviews per mastered word, review minutes per student-day → `word_memory_reports`
  + PostHog `word_memory_weekly_report`.
- `/api/jobs/fsrs-calibration` (Sundays): calibration report (log-loss, RMSE by bin;
  default vs stored) → `fsrs_calibration_reports`. Fitting uses `FsrsOptimizer`; none is
  installed yet (TODO C.3: `@open-spaced-repetition/binding`).

## Word content: automatic definitions (`src/lib/lexicon/definitions`)

Only words with an approved sense are tracked. Senses for the licensed lexical
release come from an automatic pipeline (no per-item human approval):

- `npm run lexicon:generate-definitions` (needs the gitignored release artifact,
  optionally `--lexique Lexique400.tsv` to vet spellings; models
  `LEXICON_GENERATOR_MODEL` / `LEXICON_VERIFIER_MODEL`, must differ). Generator →
  deterministic gates (`gates.ts`: ≤ 20 words, no word-family term, French
  typography, every example contains an inflected form, interest-tagged example,
  validation shape) → independent verifier (sense, age, circularity, examples,
  validation) → up to 2 regenerations → accepted / discarded. Resumable per-lemma
  cache, usage and cost in the manifest.
- Output: `generated/lexicon-definitions-v1.json` + `generated/lexicon-definitions-v1/shard-NN.json`.
- `npm run lexicon:import-definitions [--dry-run]` upserts `lexical_senses`
  (`sense_key = 'auto_core'`, `review_status = 'auto_approved'`, pipeline version,
  gate results, `examples_fr`, `definition_validation`, `close_words`, `grade_level`),
  fills `vocabulary_items` and links synonym / antonym / orthographic neighbours in
  `lexical_relationships`. Never overwrites a definition written by a person, never
  adds a sense next to a human one, never revives a `retired` (taken-down) sense.

Shapes for Phase D: `examples_fr = [{ text, interest | null }]`;
`definition_validation = [{ kind: 'key_idea', idea, keywords[], required } | { kind: 'accepted_paraphrase', text } | { kind: 'misconception', text }]`;
`close_words = { synonyms[], antonyms[], semantic[], orthographic[] }` (semantic
neighbours are same-field words that are *not* correct answers: D.4 distractors).

## Phase D: word sessions (`session/`)

| Piece | File |
| --- | --- |
| Bursts in the daily plan (`review_word`, ≈4 min, ≤16 cards, woven between activities) | `src/lib/learning/session-plan.ts` (`planWordBursts`, `weaveWordBursts`), `session/plan-entries.ts` |
| Items of one burst (formats, variants, wrong options, easiest last) | `session/builder.ts`, `session/distractors.ts`, `session/sentences.ts` |
| Loading cards, sentences, relations, neighbours, audio | `session/loader.ts` (server-only) |
| Order of play: relearning (C.4), ZPD (rule 1), end on a win (rule 3) | `session/flow.ts`, `session/zpd.ts` (client-safe) |
| Spelling feedback (wrong letters highlighted) | `session/feedback.ts` |
| "Explique avec tes mots" (rules → model → uncertain = QCM) | `session/explain.ts`, `session/explain-judge.ts`, `session/explain-server.ts`, golden set `session/explain-golden.fixture.ts` |
| Cached word TTS (`lexical_word_audio`, dictation-audio job) | `session/audio.ts` |
| Signed item tokens (answers never reach the client) | `session/token.ts` |
| Server actions | `src/lib/actions/words.ts` (`loadWordSession`, `introduceSessionWord`, `submitWordAnswer`, `explainWordAnswer`, `loadWordTreasure`) |
| Embedded reviews (D.6) | `capture.ts` (`markEmbedded`, `captureReadingVocabularyAnswers`) |

Flags (default on): `WORD_SESSION_ENABLED`, `WORD_EXPLAIN_ENABLED`, `WORD_EXPLAIN_MODEL_ENABLED`.
Optional `WORD_ITEM_SIGNING_SECRET` (falls back to `CRON_SECRET`, then the service key).
