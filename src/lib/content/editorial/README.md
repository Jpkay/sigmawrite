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

Without AI keys everything fails closed: no live generation, fallback/library texts only.

## Scripts

- `scripts/fetch-style-corpus.mts <cache>` then `scripts/build-style-cards.mts <cache>` — rebuild the measured cards (held-out accuracy is printed and stored in `index.json`).
- `scripts/editorial-smoke.mts` — real end-to-end run (outline + chapter + dictée), no database.
- `scripts/editorial-library.mts` — coverage-driven library production (service role; staging first).
- `scripts/editorial-blind-panel.mts export|score` — H.12 panel.

## Known limits

- Stylometry tense and part-of-speech measures are surface heuristics (no tagger).
- The conjugation engine covers frequent verbs; tense evidence on unsupported verbs is not counted, and the scan uses ~120 frequent verbs.
- Library reading passages land as `ai_generated_candidates` (`editorial_reading_text`, `auto_approved`) + `editorial_library_items`; materialising them into `text_versions` belongs to the reading-passage auto-approval route (G.2).
