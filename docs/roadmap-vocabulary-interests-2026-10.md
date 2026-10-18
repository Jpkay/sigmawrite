# Roadmap: vocabulary memory, interests, dictées and story mode (2026-10-18)

> Scope: written French, students from CM1 to 3e. This roadmap follows the audit of
> 2026-10-18 and goes alongside
> [`roadmap-engagement-rigor-2026-09.md`](./roadmap-engagement-rigor-2026-09.md), which is
> mostly done. Item **6.7** of that roadmap (the story arc) is replaced by Phase H below.
> [`implementation-status.md`](./implementation-status.md) says what is true today.

## Product goal

Students should feel the app was made for them. A session starts on something they
like (manga, football…), is short, ends on a win, and asks for real effort without being a
drag. Vocabulary, spelling and verb tenses are learned *through* that content, almost without
noticing. A word only counts as learned when the student has **shown, again and again over
time, that they can spell it and that they know what it means**.

## What the audit found (2026-10-18)

| Area | Today | Problem |
| --- | --- | --- |
| Word mastery | `mastery = exposures / 5` after every reading (`src/lib/actions/student.ts:2464-2473`) | Reading a word 5 times = "mastered". This contradicts the rule in migration `0092`. |
| Word evidence | `vocabulary_learning_evidence`, `evidence_counts`, `learning_status`, `fsrs_state` exist (`0092`) | Nothing writes to them. |
| Where words are seen | Only reading sessions record words | Dictées, practice, the diagnostic and writing are ignored. Misspellings are lost. |
| Spaced repetition | FSRS-6 through `ts-fsrs` (`src/lib/scoring/fsrs.ts`), `maximum_interval: 365`, no fuzz, default parameters | Words only come back on the optional `/student/vocabulary` page, which is not in the mobile menu. Every word seen is due immediately. No limit on new words per day. |
| Daily session | `buildSessionPlan` (`src/lib/learning/session-plan.ts`) only knows `practice`, `review_node`, `review_card` | Due words never reach the daily session. |
| Interests | 38 offered, at least 3 required at onboarding | About 20 have no content (manga, anime, comics, basketball, esports, dance, fashion…). Interests only choose the reading passage. Questions, exercises, dictées and the diagnostic ignore them. The onboarding promise "Tes textes partiront de là" is not kept. |
| Dictées | 9 texts written by hand, waiting for approval and audio | None for CM1, 1 for CM2. No theme, interest, target-word or tense tags. No passé simple, futur, conditionnel, subjonctif or impératif. The picker uses only grade, recent use and length. |
| Story mode | None | Item 6.7 is a story that moves forward in a straight line. The student makes no choices and is not the hero. |

## Rules for every item

**Engagement and zone of proximal development**

1. **Target success rate 70–85%** on every activity. If accuracy over the last 10 items in a
   session goes above 90%, the next item gets harder. Below 60%, it gets easier and a hint
   appears first. This is the same rule as the diagnostic, applied to every activity.
2. **Interest first.** Every session starts with content tagged with one of the
   student's interests. Vocabulary, spelling and tense work happens *inside* that content
   (sentences, dictées, story chapters about the student's interest) rather than as lists of
   words with nothing around them.
3. **Short and finishable.** The daily session lasts 10–15 minutes and the vocabulary part
   at most about 4 minutes. A session always ends on a success: the last item is chosen from
   items the student has a high chance of getting right.
4. **Never punish.** Do not show how many reviews are overdue. Do not show "you forgot 23 words".
   Lapses are framed as "on le revoit" and reviews as "rappel éclair". Words that are back are
   celebrated ("Tu as repêché *intrépide* !"). Streak freezes and the existing XP rules stay.
5. **The student gets choices.** They pick one of 2–3 texts or chapters, can change their
   interests at any time, and can skip an interest they no longer like without losing anything.
6. **A gentle first week.** On day 1 the student reads a text on one of their interests
   and gets one easy win before anything feels like a test. New words per day start low and
   rise only if the student is keeping up.

**Rigour (unchanged from the previous roadmap)**

- AI never decides spelling, conjugation or rule facts. Those come from the vetted
  base and the deterministic engines.
- Student free text always goes through `moderateOrReject`. There is no open AI chat for minors.
- **All new student content is produced and approved automatically**, with no human approving
  each text: stories, reading passages, dictées and practice sentences. They all go through the
  same editorial pipeline (Phase H) and its hard gates. Quality comes from the pipeline, and
  people audit samples (H.15). Content is marked `auto_approved` with the pipeline version, and
  never as reviewed by a person.

Size: **S** = 1 day or less · **M** = 2–4 days · **L** = 1 week or more. Each item = one PR and one
acceptance test.

---

## Phase A: Fix word tracking (bugs, do first)

- [ ] **A.1** Stop reading from raising mastery. In `student.ts:2464-2473`, reading a text adds
  one `exposure` row to `vocabulary_learning_evidence` and increases `exposures`. It no longer
  touches `mastery`. **S**. *Accept:* a unit test where a student reads a text with the word 10
  times and the word's mastery is still 0.
- [ ] **A.2** Recompute existing mastery values from evidence. A migration sets every row of
  `student_word_mastery.mastery` from typed review history only (`vocabulary_review_attempts`).
  Words that drop are shown as "à confirmer", never as "lost". **S**. *Accept:* pgTAP test
  shows a row backed only by exposures ends at 0.
- [ ] **A.3** Match words by lemma and meaning, not by spelling. Link `vocabulary_items` to the
  lexical graph (`0037_lexical_graph.sql`: lemma and sense). Exposure matching uses the lemma, so
  *courait* counts for *courir* and *bureau* (furniture) is kept apart from *bureau* (office). **M**.
- [ ] **A.4** Record every place a word is seen: dictées (each segment), practice items, the
  diagnostic, the student's own writing (correct use and misspellings), and story chapters. One
  function, `recordWordEvidence(studentId, lemmaSenseId, kind, outcome, source)`, called from each
  place. **M**. *Accept:* an integration test where a word misspelled in a dictée appears as
  `correct_spelling: false` evidence.
- [ ] **A.5** Check that word tracking still works on the new learning path. The legacy lock
  policy (`20260912120000_granular_learning_policy_bindings.sql:30`) may block writes for
  students on that path. **S**. *Accept:* an RLS test where a student on the new path records evidence.
- [ ] **A.6** Add the Vocabulaire page to the mobile menu (`src/app/student/layout.tsx:26-32`), as a
  short-term fix until Phase D lands. **S**.

## Phase B: Word memory model (what "mastered" means)

Each word has **two memory traces**, scheduled separately. These are two FSRS cards per
student, lemma and meaning:

| Trace | What it proves | Activities that count as recall (full credit) | Recognition (weak credit, never enough alone) |
| --- | --- | --- | --- |
| **Spelling** | Can write the word correctly, without help | Hear it and type it (word dictée), type it from its definition, fill a gap in a new sentence by typing it, spell it correctly in a dictée or in free writing | Pick the correctly spelled form out of 4 |
| **Meaning** | Knows what the word means | Type the word from its definition (counts for both traces), explain it in their own words (checked against the vetted definition, Phase D.5), judge whether the word is used correctly in a new sentence, choose a synonym or antonym in context | Pick the definition out of 4 |

- [ ] **B.1** Schema. Use `learning_retrieval_schedules` (`target_type = 'lexical_sense'`,
  `fsrs_state` already exists) with a `facet` column (`spelling | meaning`). Add a full review log
  table (`word_review_log`) with: card, time, rating, days since last review, activity format,
  hint used, response time, and source. The log is required for Phase C.3. **M**.
- [ ] **B.2** The mastery rule, as one pure function `wordStatus(evidence, cards)`. All numbers
  are settings and are revisited after the pilot (C.6):
  - **Spelling secured**: at least 3 correct typed answers with no help, on at least 3 different
    days, with the last one at least 7 days after the one before. FSRS stability on the spelling
    card is at least 21 days. An accent mistake counts as "Hard", not as a success.
  - **Meaning secured**: at least 3 correct recall answers with no help, on at least 3 different
    days, in at least 2 different activity formats. At least one is in a sentence the student has
    not seen before. FSRS stability on the meaning card is at least 21 days.
  - **Maîtrisé** = both traces secured.
  - **Ancré** (long-term) = both traces have stability of at least 180 days, which means the
    student passed a review at least about 4 months after the previous one.
  - Exposure, looking a word up and recognition answers **never** move the status past
    "En route".
  - A lapse moves the word back to "À revoir" and keeps its history. "Maîtrisé" comes back after
    one successful relearning plus one spaced review.
  **M**. *Accept:* table-driven tests for each rule above, including "10 recognition successes =
  not mastered" and "spelling secured without meaning = not mastered".
- [ ] **B.3** Statuses the student sees. *Découvert → En route → Presque → Maîtrisé → Ancré*. The
  word collection ("Mon trésor de mots") is grouped by interest, and each word shows the sentence
  where the student first met it. **S**.
- [ ] **B.4** How help lowers the grade. With a hint the best grade is Hard (Good if the hint was
  only the first letter). If the student sees the answer, the grade is Again. A very slow answer
  lowers the grade by one level. This uses the same rules as `src/lib/practice/scaffolding.ts`. **S**.

## Phase C: Long-term spaced repetition (months and school years, not weeks)

FSRS-6 is the best-performing open algorithm in the public open-spaced-repetition benchmark, and
we already use it. The work is to make it run over the long term: the right settings, real
parameters, a complete history, and planning around school holidays.

- [ ] **C.1** Long-term settings in `src/lib/scoring/fsrs.ts`:
  - `maximum_interval` 365 → **1825 days**, so a word can stay scheduled across the whole of collège.
  - Turn `enable_fuzz` on, so reviews don't all fall due on the same day.
  - Keep in-session retries (C.4) *out* of the FSRS state.
  - Desired retention depends on the word's status: **0.90** while learning, **0.85** for
    "Ancré" words, which keeps the long-term workload small.
  **S**. *Accept:* a simulation test where a word answered "Good" at every review reaches an
  interval of 180 days or more within 12 months, with 6–8 reviews or fewer.
- [ ] **C.2** Set the first review date when a word is introduced. Today every word seen is due
  at once. Instead, a word first needs to be *introduced* (D.1) to get its first card. Plain
  exposure only puts the word on a "to introduce" list. **S**.
- [ ] **C.3** Fit our own FSRS parameters. Run an offline job (FSRS optimizer through
  `@open-spaced-repetition/binding`, the fsrs-rs bindings; check the package when we start) on
  `word_review_log`:
  - First fit **one set of parameters per age group** (CM, 6e-5e, 4e-3e) and per trace, once
    at least about 5,000 reviews exist.
  - Fit **per student** once they have at least about 1,000 reviews, and keep the new parameters
    only if they predict better on that student's reviews that were held back.
  - Store versioned parameters. Students fall back to the defaults.
  **M**. *Accept:* the job writes parameters and a calibration report (log-loss and RMSE by bin,
  for default and for fitted).
- [ ] **C.4** Successive relearning inside a session. A missed word comes back 2–4 items later,
  in a different format, until the student gets it right once. Only the *first* attempt of the
  day updates FSRS. Research on successive relearning (Rawson and Dunlosky) shows this
  combination gives the best long-term retention. **S**.
- [ ] **C.5** Plan around school holidays and the workload:
  - School calendar by zone (French zones A/B/C plus a custom calendar), with an option to pause
    reviews during holidays.
  - FSRS uses the real time that has passed, so memory estimates stay right.
  - **Back-to-school ramp**: the week after a holiday, overdue reviews are ordered by
    retrievability × importance and capped per day, so nobody faces 200 overdue reviews.
  - **Daily caps**: at most about 15 word reviews (about 3 min) plus 3–6 new words. The number
    of new words drops automatically when overdue reviews pile up or recent success goes below 75%.
  **M**. *Accept:* a simulation over two school years with holidays, where daily load never goes
  above the cap and no review is more than 3× overdue for words that are still learning.
- [ ] **C.6** Monitor memory quality. Weekly report: predicted versus observed recall (calibration),
  real retention at 30 days and 90 days per trace, reviews per word mastered, and student time on
  reviews per day. Send events to PostHog. **S**.

## Phase D: Retrieval practice inside the daily session

- [ ] **D.1** Introducing a word (the first time is *learning*, not testing). The student meets the
  word in context in an interest text, then a child-friendly definition, an example sentence about
  their interest, and one very easy first recall right away (for example, rebuild the word from its
  letters). This creates the two cards. **M**.
- [ ] **D.2** Add an activity type `review_word` to `buildSessionPlan`. Due word cards are pulled
  in by lowest retrievability, interleaved between other activities and never in one block, and
  stay inside the vocabulary budget (about 4 min). **M**. *Accept:* `session-plan.test.ts` cases
  for budget, interleaving and the backlog cap.
- [ ] **D.3** Spelling recall activities: hear and type (TTS audio per word, cached), type from the
  definition, fill a gap by typing (the sentence comes from the student's interest), and a
  4–6 word mini-dictée. Each activity shows feedback right after the answer, with the part of the
  word where the mistake is highlighted. **M**.
- [ ] **D.4** Meaning recall activities: type the word from its definition, judge "Is the word used
  correctly?" (one correct sentence and one incorrect), choose a synonym or antonym in context, and
  "odd one out". The wrong options are built from words close in meaning and spelling, so the
  student cannot get it right by elimination. **M**.
- [ ] **D.5** "Explain it in your own words" (meaning, full credit). The student's text goes
  through `moderateOrReject`, then a constrained check against the vetted definition and its
  `definition_validation` entries (`0092`). Possible verdicts: correct, partly correct, or wrong.
  If the check is unsure, the answer is never graded as wrong: the student moves to a multiple
  choice instead. **M**. *Accept:* a golden set of 60 student definitions graded correctly at
  least 90% of the time.
- [ ] **D.6** Reviews woven into other activities. When a due word appears in today's reading
  passage, story chapter or dictée, a correct use there counts as the review (marked as
  `source = embedded`) and is removed from the separate review list. This is the main way
  vocabulary is learned "without noticing". **M**.
- [ ] **D.7** Remove the stand-alone Vocabulaire page from the main path. It stays as an optional
  "Rappel éclair" mode and as "Mon trésor de mots". **S**.

## Phase E: Interest content coverage

- [ ] **E.1** Decide which interests to keep, using data. Count `student_interests` per interest.
  Keep the most popular ones with no content (expected: manga, anime, basketball, esports,
  movies/series…). Merge the rare ones into broader groups (for example *board games* into *games*,
  *beauty* into *fashion & style*). Never show an interest that has no content. **S** (decision) +
  **S** (code: `src/lib/content/interests.ts`).
- [ ] **E.2** Minimum content per interest kept: at least 6 reading passages per age group, at
  least 20 themed practice sentences per main skill family, and at least 3 dictées per grade. Add
  this check to `npm run launch:audit-content`. **S** (check) + **L** (content, ongoing).
- [ ] **E.3** Fill each interest with no content using the editorial pipeline in **library mode**
  (H.17), fully automatic. Order: interests by popularity, then grade. Each text states its target
  words and its target tense or tenses. **L** (mostly compute; the pipeline does the work).
- [ ] **E.4** Use interests outside reading:
  - The practice item picker gives interest a real weight, not just a tie-breaker
    (`src/lib/practice/session.ts:35-38`). It still never picks an item outside the success
    zone just because it matches an interest.
  - Comprehension questions are written for each passage, so they share its theme.
  - The interest-tagged items of diagnostic bank v2 are used once the student's interests are known.
  **M**.
- [ ] **E.5** If no content matches, use the closest interest group and show "On prépare des
  textes sur *manga*". Never silently fall back to `library[0]`. **S**.
- [ ] **E.6** Fix the onboarding promise. Keep "Tes textes partiront de là" only once E.2 passes for
  every interest offered. Until then, use a more modest line. **S**.

## Phase F: Interest-aware generator for students

Rule: AI writes the *setting* (the story, the interest, the characters). Words, tenses
and spelling come from the vetted base and are checked deterministically.

- [ ] **F.1** Generation request (`src/lib/generation/contract.ts`): add `interests`, `targetLemmas`
  (at most 2 new words and 3–5 words that are due), `targetTenses`, `gradeBand`,
  `readabilityTarget`, and `studentFirstName` (optional, only for the story mode). The interests
  are passed into the system prompt, not only into the JSON input
  (`src/lib/ai/openai-compatible-provider.ts:25,74`). **S**.
- [ ] **F.2** Two ways of producing content, both automatic:
  - **Live**: stories (Phase H) and single practice sentences.
  - **Library mode** (H.17): a pre-generated pool per *interest × grade × target-word set*, used
    for reading passages and dictées.
  Both go through the same pipeline and gates. People audit samples (H.15), with no approval
  before publication. **M**.
- [ ] **F.3** Automatic checks before a student sees anything: moderation, linguistic validator,
  LanguageTool, readability band, presence of the target words and tenses (deterministic check on
  lemmas and conjugation), no names of real minors, and a cap on length. If a check fails, the
  student gets fallback content from the library, which passed the same gates. **M**. *Accept:* a test suite where texts with planted
  errors are rejected 100% of the time.
- [ ] **F.4** A teacher or admin can turn off live generation for a class. **S**.

## Phase G: Dictées (bank, tags, picker)

- [ ] **G.1** Add tags to `dictations` (migration): `themes[]`, `interests[]`, `tenses[]`,
  `target_lemmas[]`, `grammar_node_keys[]` (keep `target_node_keys`), `word_count`, `cefr_band`.
  Tag the 9 existing dictées. **S**.
- [ ] **G.2** Switch dictées from human approval to automatic approval:
  - Run the 9 existing dictées through the pipeline gates, then render their audio.
  - Change `dictations` so that `auto_approved` (with the pipeline version and the gate results)
    is enough for students to see a dictée. Today the access rule in migration `0113:69-74`
    requires an admin's approval.
  - Do the same for reading passages in the content workflow (`src/lib/content/workflow.ts`) and
    the review portal. The portal stays as an audit and takedown tool.
  **M**.
- [ ] **G.3** Dictée generation, using the editorial pipeline in library mode (H.17): writing →
  gates → automatic TTS → audio check (H.18) → published. Target: **at least 30 short dictées per grade** from CM1 to 3e,
  covering every interest kept. **L**.
- [ ] **G.4** Tense coverage, in the order of the curriculum: présent, passé composé, imparfait,
  futur (CM1–CM2); plus passé simple at 3rd person, conditionnel présent and impératif (6e–5e);
  plus plus-que-parfait, subjonctif présent and the full passé simple (4e–3e). At least 5 dictées
  per tense per grade where it applies. **L** (content).
- [ ] **G.5** Picker score (`student.ts:1336-1356`), replacing "shortest remaining":
  `score = interest_match + weak_skill_match (target_node_keys ∩ weak nodes) + due_word_overlap −
  new_word_overload − recent_theme_penalty`. Hard filters: grade, not done in the last 120 days,
  and the expected error rate (estimated from skill estimates) inside the 15–30% band. **M**.
  *Accept:* unit tests for each part of the score and the hard filters.
- [ ] **G.6** Dictée errors feed word traces: each segment updates the **spelling** trace of the
  words in it (A.4) and the grammar nodes it maps to (already done for nodes). **S**.
- [ ] **G.7** Shorter dictées for young students and beginners: 15–40 words for CM1–CM2, one
  sentence at a time, and replay allowed. **S**.

## Phase H: "Tu es le héros" story mode (replaces item 6.7)

**Decided (2026-10-18):** story mode is in scope (`roadmap.md` has been updated). It is
**literary-quality, interest-based reading with learning targets**, where the student makes choices.
It is not a generic AI story generator. The hard part is quality: the texts must read like real
French literature for young readers, in **several authors' styles**, and must not show the usual
signs of AI-written text. A multi-agent editorial team (H.7–H.12) produces them.

**Stories are generated live, for each student, with no human approving a story before it is
shown.** Quality and safety are fully automated, chapter by chapter. People check the *system*
(prompts, style cards, checks) through sampled audits and student reports. They do not approve
individual stories.

### Story mode for the student

- [ ] **H.1** Story structure:
  - Each saga has 7–10 chapters of 150–400 words, written for the student's interest and age, in
    **one author's style**.
  - Each chapter ends with 2 choices. The student's choice shapes the next chapter, but within the
    saga outline (H.13), so the story keeps a direction and a real ending.
  - Each chapter's target words are *today's* due and new words for that student (Phase D), and
    it states its target tense.
  **M** (schema + player).
- [ ] **H.2** The student as hero: first name (optional, the student can choose a nickname),
  a chosen avatar, and second-person narration ("Tu…") for some sagas. No surname, school or real
  places. **The student's name is never sent to the model.** The text is written with a placeholder,
  and the name is inserted afterwards, with the correct agreements. **S**.
- [ ] **H.3** Choices are learning moments: to open the next chapter, the student does one
  comprehension or vocabulary task (for example "Le capitaine est *intrépide* : que fait-il ?").
  The answer to the task chooses the branch, or unlocks a bonus branch. Words reviewed in
  chapters count as reviews woven into content (D.6). **M**.
- [ ] **H.4** The student writes the ending: at the end of the saga, the student writes an
  alternative ending (genre `recit`, `src/lib/writing/genres.ts`), using 3 target words,
  and can try writing *in the style of* the saga's author. It goes into the printable book of the
  student's writing (`/student/recueil`). **M**.
- [ ] **H.5** Engagement hooks: the next chapter is unlocked by the daily session, a cliffhanger at
  the end of each chapter, and no penalty for skipping a day. **S**.
- [ ] **H.6** Exposure to several styles: the saga picker rotates authors' styles, so a student
  meets at least 4 different styles per term. At the end of a saga a card explains the style:
  "Cette aventure était écrite *à la manière de* Jules Verne : de longues phrases pleines de
  détails techniques…". Where the author is in the public domain, it also gives a short real
  excerpt ("Lis le vrai Jules Verne"). This builds literary culture for the brevet. Track which
  styles each student has read. **M**.

### The editorial team (live, for each chapter)

Location: `src/lib/content/editorial/`. Every chapter moves through the roles below at the
moment it is needed. Each role has its own versioned prompt, a structured output and a score,
and every step is logged.

| Role | When it runs | Job | Output |
| --- | --- | --- | --- |
| **Saga architect** | Once, at saga start | Plot, characters, the main stages of the story, the ending, which tenses to work on, what is right for the age | Saga outline (H.13) |
| **Author agent** (the saga's style card) | Each chapter | Write the chapter in the assigned style, following the outline, the student's last choice, target words, tense, length and readability band | Draft chapter |
| **Line editor** | Each chapter | Remove AI tells (H.9), tighten the prose, vary the rhythm, replace clichés with concrete, specific details | Edited chapter |
| **Code checks** (no model) | Each chapter, in parallel | Validator, LanguageTool, AI-tells score, style measurements (H.8), target words and tenses present, readability, length, n-gram overlap with the source corpus (no copying) | Pass/fail + measurements |
| **Reviewers** (fast models, in parallel) | Each chapter | Style fit, how naturally the target words are used, proofreading for agreement and typography, safety and sensitivity (`moderateOrReject`, age, stereotypes) | Scores + notes |
| **Editor-in-chief** | Each chapter | Combine everything. **Publish**, or ask for **one** targeted rewrite, or **fall back** (H.14) | Decision + reasons |
| **Young-reader panel** (personas) | Offline, on samples | Rate engagement, boredom and confusion, to improve prompts. Not part of the live path | Audit scores |

**Hard gates** never use judgement: moderation, safety, validator errors and copying. If one fails
after the rewrite, the student never sees that chapter.

After publication, signals feed back in: where students give up in a chapter, the 😀/😐/🙁 rating,
how often they read the next chapter, and the "Signaler ce texte" button.

- [ ] **H.7** Style library (`content/styles/`), by age group:
  - **Public-domain French authors** (in France, died 1955 or earlier, after checking the
    "mort pour la France" extension). Their real excerpts can be used as examples in prompts and
    shown to students. For example: Perrault, La Fontaine, la Comtesse de Ségur, Hector Malot,
    Jules Renard and Alphonse Daudet for CM; Jules Verne, Alexandre Dumas, Maurice Leblanc and
    Gaston Leroux for 6e–5e; Maupassant, Hugo, Colette, Alain-Fournier and Louis Pergaud for 4e–3e.
  - **Modern authors still under copyright** (for example Pennac, Murail, Goscinny): described only
    in our own words, as style traits. None of their text is used in prompts, and their names are
    used publicly only after a legal check.
  - **Legal check** of the list before launch.
  **M** (list + legal check).
- [ ] **H.8** Style cards, one per author, with two parts:
  - **Measured from the public-domain corpus** (deterministic stylometry script): how long the
    sentences are and how much that varies, share of dialogue, which tenses tell the story
    (passé simple versus présent), how dense the adjectives and adverbs are, vocabulary range,
    paragraph length, and how often the narrator speaks directly to the reader.
  - **Described by a person**: voice, humour, imagery, typical scenes, rhythm, and what this author
    never does.
  The style reviewer checks drafts against the measured part. **M**. *Accept:* the script gives
  stable profiles, and two different authors' profiles can be told apart (each author's held-out
  chapters land closest to their own card).
- [ ] **H.9** AI-tells checker (French), `src/lib/content/editorial/ai-tells.ts`, made of
  deterministic checks plus a rubric for the line editor:
  - **Phrases to avoid**: « Soudain » used too often, « Au cœur de », « Dans un monde où »,
    « un mélange de », « une danse de », « témoignage de », « plonger dans », « palpitant »,
    « murmura » used too often, and so on.
  - **Habits to avoid**: lists of three everywhere; a moral at the end ("Et c'est ainsi qu'il
    comprit que l'amitié…"); emotions named instead of shown; sentences all about the same length;
    every paragraph ending on a punchline; adjectives in pairs; dialogue too neat and symmetrical;
    no concrete sensory details; overused names (Léa/Lucas everywhere, made-up fantasy names);
    too many dashes and semicolons; perfectly balanced paragraphs.
  - **Measured signals**: variation in sentence length, how often words repeat, vocabulary range,
    and the share of known clichés.
  The list keeps growing from editors' notes. **M**. *Accept:* on a set of 40 texts, half AI drafts
  and half human children's literature, the checker scores the AI drafts clearly worse, and
  scores the human texts with few false alarms.
- [ ] **H.10** Live orchestrator. It runs a chapter through the roles above with at most one
  rewrite, a cost cap per chapter, and the full history saved in `editorial_runs`. It reuses the
  provider layer (`src/lib/ai/provider.ts`). The author and line editor use the strongest
  available writing model. Reviewers use fast models, and the measurements are done by code.
  *Accept:* time from a choice to the next chapter ready is below 60 s at the 95th percentile,
  measured in staging. **L**.
- [ ] **H.11** Hide the waiting time. Reading a 150–400 word chapter takes 2–4 minutes, so:
  - While the student reads chapter N, generate chapter N+1 for **both** choices.
  - When the student picks a choice, the next chapter is already ready.
  - The unchosen branch is thrown away (or kept for "Et si… ?", a bonus re-read).
  - For chapter 1, the outline and opening are written while the student picks the saga and
    their avatar. If it is not ready yet, show "Ton aventure s'écrit…" with a short animation,
    for at most about 20 s.
  **M**.
- [ ] **H.12** Quality gate on the *pipeline* (before launch, and after each change to prompts or
  models), not on each story:
  - **Blind panel**: editors and teachers, plus a few students, read a sample of live-generated
    chapters mixed with real published children's books for the same age.
  - **Target to pass**: AI chapters rate at least 4/5 on average, and the panel finds them no
    more than about 60% of the time (50% would be pure guessing).
  - Do this once per pipeline version. It never blocks a particular student's story.
  **M**.
- [ ] **H.13** Saga outline. At saga start the architect writes the plot stages, the characters,
  2–3 possible endings, and where each tense is used. Each new chapter must move the story towards
  one of those endings. This keeps live stories coherent across 7–10 chapters, which
  generating one chapter at a time cannot guarantee by itself. Store the outline and a short
  summary of the story so far, and pass both to each chapter. **M**.
- [ ] **H.14** Fallback chapters. For each interest × age group × style there is a small set of
  chapters already generated and checked by the same pipeline. A fallback is used when a live
  chapter fails a hard gate after the rewrite, or when generation is too slow or down. A bridge
  sentence written with a template connects it to the story. The student never sees an error.
  Track how often fallbacks are used; a target is below 2% of chapters. **M**.
- [ ] **H.15** Continuous audit, not prior approval:
  - Every day, stronger reviewer agents re-check a random sample of 1–2% of live chapters, plus
    every chapter a student reported.
  - Each week, a person reads the worst-scoring chapters and the reported ones. What they find
    updates the AI-tells list (H.9), the style cards and the prompts.
  - A rule that alerts when quality scores drop or when reports rise above a set level.
  - A switch to turn story generation off for a class or for everyone (F.4).
  **M**.
- [ ] **H.16** The same pipeline also writes personalised reading passages (E.3) and dictées (G.3)
  from the student's interests. Dictées still need TTS audio after the text is written, so
  personalised dictées are generated the day before the session. **L**.
- [ ] **H.17** **Library mode** for passages and dictées that are not live. There is no time
  pressure, so it uses more computing time to aim for the best literary quality:
  - **Best of 4**: 4 drafts from the author agent. The reviewers compare them in pairs, and the
    winner goes on.
  - **Up to 3 rounds of revision**, compared with 1 when live. Each round's notes go to the role
    that needs to act on them.
  - **A higher bar than live**. A text is published only if it reaches at least 4.3/5 on the
    literary rubric (H.19) and passes every gate. Otherwise it is thrown away, never "fixed by
    hand".
  - **Dictées are read aloud as a check**: the text must read well when dictated, with no tongue
    twisters or ambiguous homophones unless they are on purpose, and segments that make sense
    when you hear them.
  **M**.
- [ ] **H.18** Automatic audio check for dictées. The rendered TTS audio is transcribed again by
  speech-to-text and compared with the text. Pronunciation and liaisons are checked, and segments
  must be audible. If the check fails, the audio is rendered again with a different voice or
  settings. If it fails again, the dictée is not published. **M**.
- [ ] **H.19** Literary quality rubric, shared by every reviewer and by the blind panel, with
  scores from 1 to 5:
  - **Voice**: there is a narrator with a personality, true to the style card.
  - **Concreteness**: specific sensory details instead of general statements.
  - **Rhythm**: varied sentences, read aloud without stumbling.
  - **Dialogue**: sounds like real speech for the age and the period.
  - **Show, don't tell**: emotions come through actions and details.
  - **Surprise**: at least one unexpected image or turn per text.
  - **No moralising**.
  - **Vocabulary**: rich and fits the age; the target words read naturally.
  - **Language**: correct, careful French (agreement, punctuation, typography).
  The rubric comes with examples: short anchor excerpts from public-domain authors for each score
  level, so that scores stay consistent between models and over time. Each month, a person scores
  a sample of texts to check the reviewer agents still give the same scores as people (H.15). **M**.

---

## Sequencing

1. **Phase A** first. These are bug fixes and they are small. A.1 and A.2 can ship this week.
2. **Phase B** then **C.1, C.2, C.4** and **D.1–D.4**: the core of the word memory. Start
   collecting `word_review_log` as early as possible, because C.3 needs months of data.
3. In parallel, **E.1 and E.5** (quick decisions and fallbacks) and **G.1, G.2, G.5, G.7** (dictée
   tags, approval, picker).
4. Start **H.7–H.9** (style library, style cards, AI-tells checker) early, because they are mostly
   research and authoring with few code dependencies. Then **F** (generator) and **H.10–H.11**
   (live orchestrator and pipeline quality gate), **H.11, H.13–H.15** (hiding the wait, outline,
   fallbacks, audit) and **H.17–H.19** (library mode, dictée audio check, literary rubric).
   Then the story mode for students (**H.1–H.6**), and **H.16** (the same
   pipeline writing passages and dictées).
5. **C.3** (fitting our own parameters) and **C.5** (holidays) before the end of the first school
   year with real students.

## Success measures (from PostHog and the database)

- **Memory:** observed recall at 30 and 90 days at least 85% for words that are learning and
  at least 80% for "Ancré" words. Calibration error (RMSE) of the fitted parameters better than default.
- **Efficiency:** median reviews per word reaching "Maîtrisé" at most 8. Word reviews at most 4 min per day.
- **Learning:** words mastered per student per month (target 15–30, depending on grade). Share
  of mastered words still recalled after 6 months.
- **Zone of proximal development:** median success rate in session between 70% and 85%. Share of sessions where
  the student gives up halfway below 10%.
- **Engagement:** return rate at day 7 and day 30. Sessions per week. Share of sessions opened on an
  interest text. Story chapters finished. How the student rates the session
  (one-tap 😀/😐/🙁 at the end, optional).
- **Text quality:** library texts score at least 4.3/5 on the rubric (H.19), live chapters at least
  4/5. Blind panel score at least 4/5. AI-written text spotted no more than about 60% of
  the time. Fallback chapters below 2%. Reported chapters below 0.5%. Time to the next chapter
  below 60 s (95th percentile), and the student almost never waits because the next chapter is
  prepared ahead. At least 4 authors' styles read per student per term.
- **Coverage:** every interest offered passes E.2. At least 30 dictées per grade. Every tense in the
  curriculum present at each grade where it applies.
