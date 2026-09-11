# Diagnostic clock boundary

Answer, skip and resume commands disable question interaction while the server processes them. Previously, their processing interval could be charged to the next question. The action now captures request receipt before authentication, and the service starts the next timed interval after release loading, grading and transition work. Both timestamps remain server controlled; client timestamps remain invalid input.

Background heartbeats leave the question usable, so their processing time continues to count. Pause leaves the clock stopped. This correction does not exclude database save time, subsequent material-delivery recording, network transport or browser rendering. It does not establish an end-to-end latency improvement.

Validation: 505 tests across 147 granular test files passed, including explicit delayed resume, answer, skip, pause and heartbeat scenarios. TypeScript and lint for the three changed source files passed. The source correction has not yet been deployed; the ongoing full public diagnostic journey uses the earlier runtime.
