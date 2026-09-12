# Diagnostic audio foundation

The approved sound-to-spelling prerequisite accepts a heard or represented sound. A displayed model spelling would allow copying and would not establish unaided production. The new optional audio stimulus supports a listening cue without publishing its transcript to the diagnostic client.

Metadata allows only a SHA-256 digest, French locale, MP3 format and bounded duration. The public question exposes an opaque content-addressed asset path and MIME type. Unknown fields (including transcript or remote URL) are rejected. Question timing adds the declared clip duration to the existing estimate. Publication/export scripts require the referenced local bytes to exist and match the digest.

The actual diagnostic component has native playback controls. Its UI prevents submission until playback finishes, resets the gate for a new question, and permits a skip after playback failure. The form handler also guards submission, not only the button. This is a usability gate, not proof that a learner listened: client events are not mastery evidence. Existing server-side grading remains authoritative. Skips use the existing unassessed path.

Validation: 589 granular tests pass, TypeScript passes, and the isolated real-component browser event fixture verifies blocked submission, playback completion, question changes, failure/skip and subsequent text-only questions. The fixture uses mocked actions and dispatched media events. It does not prove real audio decoding, pronunciation, calibrated duration or a live student journey. The byte check likewise verifies identity, not pronunciation or codec validity.

No audio question bank or speech clips are added by this implementation. The sound-to-spelling prerequisites and cédille activation remain incomplete. Next: author suitable listening items, generate and inspect their clips, verify actual playback and timing, bind material exposure, provide corresponding teaching, then run server and deployed journeys before activation. The frozen 231-target release candidate is unchanged.
