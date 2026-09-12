# Dictation catalog delivery capture

The authenticated catalog loader now journals its returned titles, focus descriptions and other text before returning them. This records material offered on the list even when no dictation is opened. It does not record the unreturned source transcript as visible text. Five focused tests cover authenticated ownership, exact returned payload, capture failure and retry, failed source reads, role refusal and rejected client-supplied ownership.

Audio audit finding: startDictation returns signed storage URLs in server mode, with browserText null. The generic text journal deliberately excludes URLs, so this response does not establish the transcript or bytes of audio offered. Browser fallback text is recorded but is development-only. Reading aloud reuses the already-delivered paragraph, while granular question audio has separate asset assertions. These observations do not establish complete audio coverage or playback. A source-version/checksum binding for dictation audio is still required before any complete-history contract can be enabled.

This change has not been deployed and is absent from the frozen revision 37 candidate. No historical coverage or human approval is created.
