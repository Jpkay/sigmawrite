# Sound-to-spelling audio draft assets

These assets prepare the approved `associer_phoneme_graphie_frequente` prerequisite. They are not yet registered diagnostic questions or activated teaching content.

The draft contains 32 assessment words: four words for each of `ch`, `ou`, `gn`, and `f`, separately for recognition and controlled production. Eight additional words are reserved for teaching. These four groups are an initial sample, not complete French phonology coverage.

The frozen manifest is `generated/french-phoneme-graphie-audio-draft.json`. Each MP3 in `public/diagnostic-audio` is named by its SHA-256 digest. The authoring script records the installed French Thomas voice, speech rate, exact spoken input and duration. The spoken introduction is “Le mot est : …”. The manifest is authoring provenance; it must not be projected into student question payloads because it contains the answer.

Verification:

- The draft tests check group/mode counts, exact masks, teaching/assessment word separation, complete manifest membership, exact asset hashes and absence of identical clips across words.
- `scripts/render-phoneme-graphie-audio.mts --check` verifies the frozen assets without regenerating speech.
- `scripts/verify-phoneme-audio-playback.mts` decodes every clip with ffmpeg, checks for a non-silent signal, then plays every clip to completion in Chrome and replays the last clip. Its JSON report records browser durations and hashes. The fixture serves explicit UTF-8 HTML so the French playback button has the correct accessible name.
- Playback and decoding do not establish correct pronunciation. Every asset remains `draft_requires_pronunciation_review`.

Before these targets enter a released pathway, implement and verify canonical questions, guided teaching playback, coverage across sound groups, and novelty protection for audio as well as written material. Then run the complete question → results → teaching → independent follow-up journey. Existing diagnostic sessions and the demo account are unchanged by this draft.

## Recorded-audio novelty

Question material annotations now include `audio:sha256:<digest>` for the exact validated recording, even without written annotations. A previously recorded audio exposure prevents a question from claiming novel words or sentences merely by changing its written label. Missing audio receipt evidence also prevents that novelty claim. This does not prove that the student listened, and different recordings of the same word still need reviewed word identity annotations.

Migration `20260912024000_audio_material_exposure.sql` extends the existing append-only exposure ledger and recording RPC to admit audio identities. It retains ownership checks, idempotent presentation IDs, existing histories and service-only access. Apply this migration before publishing any audio questions. It has not been applied remotely as part of this change. Teaching audio projection and lesson exposure registration are covered by the subsequent integration below.

## Guided teaching integration

Lesson examples and guided exercises now accept the same strictly validated audio metadata as diagnostic questions. The public teaching view explicitly projects the example/exercise fields and an opaque audio URL, and excludes authoring metadata. Lesson audio identities join the existing conservative lesson-wide exposure set when teaching starts; this is recorded presentation, not proof of listening or mastery.

Guided practice waits for that exercise’s playback to end before the client submits an answer. The gate resets between exercises and on audio failure. A failed recording offers retry or leaving the activity; it does not promise a question-skip action that guided teaching does not provide. Example playback does not unlock exercise answers. Publication preflight now verifies exact asset bytes for both teaching examples and guided exercises, including recordings absent from the diagnostic bank.

Validation: 594 granular tests, TypeScript, and the actual guided React component’s browser event fixture pass. `teaching-audio-ui-2026-09-12.json` records that fixture; it is not a real student journey or pronunciation review. Canonical sound-to-spelling questions, group-level coverage requirements, actual guided content and end-to-end release verification remain unfinished.

## Canonical questions and guided content

`expand-v3-phoneme-graphie.mts` generates 32 canonical draft questions against the approved `associer_phoneme_graphie_frequente` evidence targets: 16 recognition and 16 controlled production. Each question has a masked word and fixed audio; recognition offers four completed spellings, while production asks for the completed word. The restricted four-pattern response space carries a conservative 25% guessing floor in both modes. Generated items remain `needs_human_review`, without review attribution.

`build-phoneme-graphie-teaching.mts` binds the eight teaching recordings to two draft lessons. Each has four illustrated/audio examples and four guided exercises. Teaching and assessment words and recording hashes do not overlap. Lessons explicitly limit their claim to the four patterns and do not present this as full phonology or dictation mastery.

Three focused tests verify exact assets for all 40 recordings, material separation, grading of every written alternative, one correct recognition choice, restricted guessing estimates, missing-asset rejection, and lesson coverage. TypeScript passes. The generated expansion and lessons are frozen in Git but are not registered in the global candidate catalogue yet. Next: enforce evidence across all four groups (so success on one group cannot certify the whole target), reserve fresh checks in each group, register the content, and verify complete learning journeys before publication.

## Coverage contract and expanded inventory

The inventory now contains 64 assessment words plus eight teaching words, with 72 frozen recordings. The expanded playback report verifies every recording and replay in Chrome; pronunciation remains pending review.

Source-bound auditory questions add four evidence features (`ch`, `ou`, `gn`, `f`). Each feature requires four distinct items/contexts, retaining the approved graph's occasion, accuracy and novelty requirements. This prevents pooled success on one group from confirming the whole target. Existing banks without the auditory format retain their former requirements. Two older unannotated items are excluded only in candidate banks containing the replacement auditory format, because they cannot establish the required novel-word evidence.

The fresh-material allocator now tries a balanced feature partition before its bounded search. It accepts that partition only if the existing cross-pool novelty and both pool sufficiency checks pass. This avoids a search-limit result caused by assigning all early examples of one feature to the first pool. The real candidate allocates 16 initial and 16 learning questions per response mode, with four of each feature in each pool.

Both audio lessons are registered in the draft catalogue and have 16 fresh checks each. The releasable scope remains 231 targets: the graph also requires `segmenter_syllabes_ecrites` in recognition and production before these audio targets. Those prerequisite pathways still need preparation. Subsequent learning-journey verification must also check the per-skill question cap against this 16-item feature contract; the initial diagnostic may legitimately leave it unresolved within its time budget.
