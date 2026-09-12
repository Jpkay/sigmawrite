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

Migration `20260912024000_audio_material_exposure.sql` extends the existing append-only exposure ledger and recording RPC to admit audio identities. It retains ownership checks, idempotent presentation IDs, existing histories and service-only access. Apply this migration before publishing any audio questions. It has not been applied remotely as part of this change. Teaching audio projection and lesson exposure registration remain to implement.
