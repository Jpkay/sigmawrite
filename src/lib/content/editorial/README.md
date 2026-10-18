# Editorial pipeline (roadmap Phase F + H.7–H.19)

Writes every student text — live story chapters, library reading passages,
dictées and fallback chapters — automatically, in the style of a known French
author, with deterministic gates and model reviewers. No person approves a
text. People audit samples after publication (H.15) and can only improve the
system; the only things that stop a text are automatic (a failed gate → fallback,
a quality alert → library texts) or the admin/teacher switch.

## Flow

```
brief (F.1) ──► architect (saga outline, H.13, once per saga)
            └─► author ─► code checks ─► line editor ─► code checks ∥ reviewers ─► editor-in-chief
                                                                              ├─ publish
                                                                              ├─ ONE targeted rewrite (live) / up to 3 rounds (library)
                                                                              └─ fallback (live, H.14) / discard (library)
```

| File | Role |
| --- | --- |
| `brief.ts` | Generation brief: interests, ≤2 new + ≤5 due target words, tenses of the band, readability, length, hero placeholder `{{HEROS}}` (the real name is never sent). `src/lib/generation/editorial-contract.ts` is the same block inside the generation contract. |
| `styles.ts` + `content/styles/` | Style library (H.7/H.8). `cards/*.json` = human part (French), `index.json` = measured part + verbatim excerpts, `corpus/` = held-out public-domain samples, `legal.json` = rules and exclusions. Modern authors: traits only, `publicName=false`, legal check pending. |
| `stylometry.ts` | Deterministic profile (sentence length/variation, dialogue share, narrative tenses, -ment adverbs, adjective suffixes, MATTR, reader address, punctuation, function words) + Burrows' Delta attribution. |
| `ai-tells.ts` | H.9 checker (phrases, habits, measured signals) + `LINE_EDITOR_RUBRIC`. Calibrated on `fixtures/ai-tells-calibration.json` (20 real naive AI drafts vs 20 public-domain samples). Add new tells to `AI_TELL_PHRASES`. |
| `rubric.ts` | H.19 literary rubric (9 dimensions, 1–5) with anchors: verbatim public-domain excerpts (5), a real AI draft (3), a written example (1). Bars: live 4.0 (floor 3.6 after the rewrite), library 4.3. |
| `targets.ts` | Target words and tenses checked by morphology + the conjugation engine. Model declarations (`tenseEvidence`) are verified, never trusted. |
| `gates.ts` | F.3 gates. Hard: moderation (fails closed), safety lexicon, personal data / student name, copying (7-gram overlap with excerpts), hero markers, length cap. Required: target words, tenses, length band, LanguageTool (when `LANGUAGETOOL_URL` is set). Signals: names outside the cast, readability, AI tells, style measures. |
| `typography.ts` | Deterministic French typography after each writing step. |
| `prompts.ts` | Versioned prompts (`PROMPT_VERSIONS`) and tolerant output schemas for every role. |
| `llm.ts` | Role → model map (env), OpenAI-compatible client (OpenRouter cost reporting), `CostMeter` cost cap. |
| `team.ts` | Shared steps and the editor-in-chief's deterministic rules (`judge`). The chief model only phrases rewrite instructions. |
| `live.ts` | H.10 live orchestrator: one rewrite max, cost cap, timeout, never throws (returns `fallback`). |
| `library.ts` | H.17: best-of-4, pairwise tournament judged in both orders, up to 3 rounds, ≥4.3 bar, discard otherwise. |
| `dictation.ts` / `audio-check.ts` | Dictée segmentation and read-aloud checks; H.18 TTS → STT round trip (behind `EDITORIAL_STT_ENABLED`). |
| `saga.ts` / `fallback.ts` | H.13 outline, tense plan, running summary; H.14 fallback pick + template bridge sentence. |
| `audit.ts` / `audit-runner.ts` | H.15 sampling (1.5 % default), alert rules, automatic switch to library texts. |
| `kill-switch.ts` | F.4 decision: `STORY_LIVE_GENERATION` flag, provider configured, global setting, quality auto-switch, class switches. |
| `story-service.ts` | Story backend over the service-role client (sagas, chapters, choices, progress, prefetch). |
| `library-runner.ts` / `publisher.ts` | Coverage-driven library jobs and writes to content tables (always `auto_approved` + pipeline version + evidence). |
| `passage-publisher.ts` | H.16: turns an `editorial_reading_text` candidate into a real reading passage through `publish_editorial_passage` (SQL, service role, atomic): `texts` + `text_versions` (`auto_approved`, `ai_automated`, grade band, deterministic difficulty) + 3-choice questions + target words in `text_vocabulary` (`is_target_word`, vetted items only) + interest concepts. Served to every student by the existing reading flow (no cohort or exposure cap, unlike the selective pilot); `withdraw_editorial_passage` takes it out of new sessions. |
| `bulk.ts` | Bulk library production plan + resumable runner (budget, attempts per cell) for `scripts/editorial-bulk.mts`. |
| `day-before.ts` | H.16 day-before personalised dictées: who has a dictée tomorrow, does the pool already fit, one generation per interest × grade, daily budget. |
| `bench-configs.ts` | Live configurations compared by `scripts/editorial-live-bench.mts`. |
| `panel.ts` | H.12 blind panel export/scoring. |

## Server actions for the story UI (`src/lib/actions/story.ts`)

All check the student session and saga ownership; generation runs in `after()`.
Pages that call them should export `maxDuration = 300`.

| Action | Input | Returns |
| --- | --- | --- |
| `startSaga` | `{ interest, style?, hero?: { name?, gender: "f"|"m"|"n" } }` (nickname moderated, stored on the saga, never sent to a model; no name → second-person narration) | `{ sagaId }` — outline and chapter 1 are written in the background |
| `getChapter` | `{ sagaId, chapterId? }` (default: current chapter) | `ChapterView`: `status` `ready` / `writing` (show "Ton aventure s'écrit…", poll every few seconds) / `unavailable`; chapter paragraphs with the hero's name inserted, 2 choices (with `task` slot for H.3), `isLast`, and `styleReveal` (style card + public-domain excerpt) once the saga is completed. Schedules the prefetch of both next branches. |
| `chooseBranch` | `{ sagaId, chapterId, choiceIndex: 0|1|null (null on the last chapter), rating? }` | `{ nextChapterId, completed }` — then call `getChapter({ sagaId, chapterId: nextChapterId })` |
| `reportText` | `{ kind: "story_chapter"|"passage"|"dictation", contentId, reason, note? }` | `{ ok }` — note moderated; feeds the daily audit |

`POST /api/story/prefetch { sagaId, chapterId }` (student session) generates
both next branches inline (up to 300 s); the player can fire and forget it.

Tables (migration `20261018130000_editorial_pipeline.sql`): `story_sagas`
(`hero_name`, `hero_gender`, `outline`, `running_summary`, `style_key`),
`story_chapters` (`body_template` with markers, `bridge`, `source` live/fallback,
`scores`), `story_choices` (`task` jsonb for H.3), `story_progress`,
`story_chapter_reads` (choice + 😀/😐/🙁 rating), `editorial_text_reports`.
Students read their own rows; writes go through the service role.

Target words of a live chapter come from `getDueWordCards` (src/lib/vocabulary: due cards ≤ 5, words to introduce ≤ 2 within the daily allowance). When the student finishes a chapter, `captureReadingExposure(source: "story")` records the words met (D.6, best effort).

## Library texts reach students

- **Passages (H.16 / E.3).** `runLibraryJob` publishes every passage that met the bar at once (`publishEditorialPassage`); the hourly `/api/jobs/editorial-library` first sweeps candidates left unpublished (`pending_editorial_passages`). The passage gets the brief's grade as `difficulty_band` (Foundation 5A … Secondary 9A), so `missingInterestCoverage` counts it in the right age band, and its interest as `texts.primary_interest`, so `recommendReadingText` serves it. The SQL function re-checks the evidence (pipeline version, rubric ≥ 4.3, every hard/required gate passed, questions with the answer among 3 choices) and keeps questions and text immutable.
- **Dictées (G.3).** `publishDictation` → `autoApproveDictation` (dictée gates + the editorial evidence gate); audio comes from `/api/jobs/dictation-audio`.
- **Day-before personalised dictées.** `/api/jobs/editorial-dictees` (daily, 15:00 UTC, `EDITORIAL_DICTEE_JOB=true`): for students active in the last 7 days whose next dictée falls by tomorrow, the picker is asked what it would serve; when a dictée on one of their interests fits without relaxing the error band or recency, nothing is generated. Otherwise one dictée per interest × grade (their most shared due words, ≤ 5), at most `EDITORIAL_DICTEE_DAILY_MAX` (4) and `EDITORIAL_DICTEE_DAILY_BUDGET_USD` ($3, counted from `editorial_runs` tagged `day_before`).
- **Bulk production.** `scripts/editorial-bulk.mts --budget <USD> [--execute]` walks the coverage gaps cell by cell (passages per interest × band, dictées per interest × grade, fallback chapters per interest × band). Plan only without `--execute`. The state file (`--state`, default `editorial-bulk-state.json`) keeps the total spend across runs and the attempts per cell (a cell is left alone after `--max-attempts` failures); coverage is re-read at each start. Each text gets at most what is left of the budget as its cost cap.

## Live practice sentences (F.2)

`src/lib/practice/live-sentence*.ts`, behind `PRACTICE_LIVE_SENTENCES=true` (off by default: it spends model budget on a student page). On a practice page, the first two plain conjugation items (`conjugator` with verb, tense, person) get a sentence set in one of the student's interests. The model (`EDITORIAL_MODEL_PRACTICE`, default Haiku 5.5 without thinking) only writes the setting; the expected form comes from the conjugation engine and code checks it appears exactly once right after the right subject (elision, subjonctif, impératif handled), with the local moderation rules, the safety lexicon, no proper names, no digits or links, one sentence, a word cap — then provider moderation. The form is blanked and grading stays the item's validator. Sentences are cached per item × interest in `live_practice_sentences` (`auto_approved`, reused for other students); a sentence that is not ready within `PRACTICE_LIVE_TIMEOUT_MS` (4 s) is finished in the background (`after()`) for the next session. Any failure keeps the bank prompt.

## Cost and latency of live chapters

Measured on 2026-10-18 through OpenRouter (real keys, `scripts/editorial-smoke.mts` and `scripts/editorial-live-bench.mts`):

| Run | Steps (latency, cost) | Total |
| --- | --- | --- |
| Baseline, football 6e, Verne, chapter 1 | author Opus 31.0 s $0.089 · line editor Opus 34.7 s $0.097 · 4 Gemini 3.8 Flash reviewers in parallel 12–32 s $0.016 · final provider moderation never answered | fallback at the 150 s timeout, **$0.316** |
| Baseline (earlier run, same brief) | — | published, **107.8 s, $0.216** |
| Sonnet 5.5 author, same brief | author 31.4 s, 4 280 output tokens of which 2 490 thinking | $0.056 for the author step |
| Probe: one-line JSON | Gemini 3.8 Flash 8.7 s $0.0021 (550 thinking tokens) · Opus 5.5 5.8 s $0.0075 · Sonnet 5.5 4.3 s $0.0034 · Haiku 5.5 thinking off 1.0 s $0.00003 | — |

Findings:
- Thinking is mandatory on OpenRouter for Opus 5.5, Sonnet 5.5 and Gemini 3.8 Flash (`reasoning.enabled=false` is refused; effort `low` barely changes a short call). Thinking tokens are billed as output: they are most of the writer cost. Only Haiku 5.5 can turn it off. `EDITORIAL_REASONING_WRITER|REVIEWER|CHIEF|AUDITOR|PRACTICE` (`default`, `off`, `minimal`, `low`, `medium`, `high`) control it.
- Reviewers on Gemini Flash take 12–32 s each because of mandatory thinking: they, not the writers, decide the parallel review time.
- The provider moderation call had no timeout and stalled one run past 150 s. Now: 15 s (`EDITORIAL_MODERATION_TIMEOUT_MS`), one retry, then the hard gate fails closed; and the line editor's pre-check no longer calls the provider (local rules only), the final text always does. These two changes are on by default (no effect on quality).
- The line editor can now run `always` (default), `conditional` (only when the deterministic pre-check finds an AI tell, a failed required gate or a signal) or `never` (`EDITORIAL_LIVE_LINE_EDIT`).

Projected from the measured steps (list prices; **not yet measured end to end**):

| Configuration (`bench-configs.ts`) | Cost / branch | Latency |
| --- | --- | --- |
| baseline | $0.22–0.32 (+ ~$0.19 per rewrite) | 100–150 s |
| sonnet-opus | ≈ $0.17 | ≈ 95 s |
| sonnet-opus-cond-haiku | ≈ $0.06–0.16 | ≈ 35–70 s |
| sonnet-only-haiku | ≈ $0.06 | ≈ 35 s |

The quality side (fixed-judge rubric ≥ 4.3, AI-tells pass) could not be measured: the OpenRouter account ran out of credit during this work ($10 total, shared with other streams). The defaults (Opus writers, Gemini reviewers, line edit always) are therefore unchanged. To finish the comparison and switch defaults:

```
node --env-file=<AI keys only> --import tsx scripts/editorial-live-bench.mts \
  --configs baseline,sonnet-opus,sonnet-opus-haiku,sonnet-opus-cond-haiku,sonnet-sonnet-haiku,sonnet-only-haiku \
  --samples 4 --budget 6 --outlines /tmp/outlines.json --out /tmp/bench.json
```

then set the winning configuration's `EDITORIAL_MODEL_*`, `EDITORIAL_REASONING_*` and `EDITORIAL_LIVE_LINE_EDIT` (or change `DEFAULT_OPENROUTER_MODELS` / `DEFAULT_REASONING` / `DEFAULT_LINE_EDIT`). Expect about $3–4 for that run.

## Configuration

| Env | Default | Meaning |
| --- | --- | --- |
| `STORY_LIVE_GENERATION` | off | Live chapters for students. Off → every chapter comes from the fallback pool. |
| `EDITORIAL_MODEL_AUTHOR`, `_LINE_EDITOR`, `_ARCHITECT` | `anthropic/claude-opus-5.5` on OpenRouter | Strongest writing model. |
| `EDITORIAL_MODEL_REVIEWER`, `_SUMMARIZER` | `google/gemini-3.8-flash` | Fast reviewers and pairwise judge. |
| `EDITORIAL_MODEL_CHIEF` | `anthropic/claude-sonnet-5.5` | Rewrite instructions. |
| `EDITORIAL_MODEL_AUDITOR` | `anthropic/claude-opus-5.5` | Daily audit. |
| `EDITORIAL_LIVE_COST_CAP_USD` / `EDITORIAL_LIBRARY_COST_CAP_USD` | 0.6 / 3 | Cost cap per chapter / library text. |
| `EDITORIAL_LIVE_RUBRIC_FLOOR` | 3.6 | Live floor after the rewrite. |
| `EDITORIAL_LIVE_TIMEOUT_MS` | 150000 | Live timeout → fallback. |
| `EDITORIAL_AUDIT_SAMPLE_RATE` | 0.015 | H.15 sample. |
| `EDITORIAL_LIBRARY_JOB`, `EDITORIAL_LIBRARY_BATCH` | off, 2 | Hourly fallback-pool job. |
| `EDITORIAL_STT_ENABLED`, `STT_API_KEY`, `STT_BASE_URL`, `STT_MODEL`, `EDITORIAL_TTS_ALT_VOICE` | off | H.18 round trip. |
| `EDITORIAL_DICTEE_JOB`, `EDITORIAL_DICTEE_DAILY_BUDGET_USD`, `EDITORIAL_DICTEE_DAILY_MAX` | off, 3, 4 | Day-before personalised dictées. |
| `EDITORIAL_LIVE_LINE_EDIT` | always | `always` / `conditional` / `never`. |
| `EDITORIAL_REASONING_WRITER`, `_REVIEWER`, `_CHIEF`, `_AUDITOR`, `_PRACTICE` | default (practice: off) | OpenRouter thinking effort per tier. |
| `EDITORIAL_MODERATION_TIMEOUT_MS` | 15000 | Provider moderation timeout (one retry, then fail closed). |
| `PRACTICE_LIVE_SENTENCES`, `PRACTICE_LIVE_TIMEOUT_MS`, `EDITORIAL_MODEL_PRACTICE` | off, 4000, `anthropic/claude-haiku-5.5` | F.2 live practice sentences. |

Without AI keys everything fails closed: no live generation, fallback/library texts only.

## Scripts

- `scripts/fetch-style-corpus.mts <cache>` then `scripts/build-style-cards.mts <cache>` — rebuild the measured cards (held-out accuracy is printed and stored in `index.json`).
- `scripts/editorial-smoke.mts` — real end-to-end run (outline + chapter + dictée), no database.
- `scripts/editorial-library.mts` — coverage-driven library production, small batches (service role; staging first).
- `scripts/editorial-bulk.mts` — bulk library production with a total budget, resumable (plan only without `--execute`).
- `scripts/editorial-live-bench.mts` — cost / latency / quality comparison of live configurations (no database).
- `scripts/editorial-blind-panel.mts export|score` — H.12 panel.

## Known limits

- Stylometry tense and part-of-speech measures are surface heuristics (no tagger).
- The conjugation engine covers frequent verbs; tense evidence on unsupported verbs is not counted, and the scan uses ~120 frequent verbs.
- Library reading passages are also kept as `ai_generated_candidates` (`editorial_reading_text`, `auto_approved`) + `editorial_library_items` (evidence); the content review workflow lists only its own candidates.
- The H.15 daily audit samples story chapters; passages are withdrawn through `withdraw_editorial_passage` (admin or service role), not yet sampled automatically.
