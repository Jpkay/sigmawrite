# Release payload and remaining start latency

A local reproduction of the authenticated start path against the deployed database measured 4,662 ms: 1,379 ms for authentication, profile, student identity and access; 3,253 ms for the store; and 29 ms for the view and empty material-delivery handling. The fixture was the paused 160-target technical QA account with zero answers. No answer or diagnostic reset was submitted.

The release response was 11,773,618 bytes and took 1,393 ms to receive locally. The remaining requests each took roughly 220–430 ms. The release contains the complete assessment and bank, so every action fetches far more than the current question. This is a concrete optimization target, but the local reproduction does not explain all of the roughly 16-second browser opening. Response cloning adds measurement overhead; local and deployed CPU/network conditions differ.

The repository's `guard_granular_assessment_release` trigger in migration 0147 forbids changes to published or withdrawn bundle content, checksums, parent identities and release keys. It permits withdrawal and requires exact publication permission for published parallel-review releases. Content reuse must preserve that distinction: immutable material may be reusable, whereas published status, parent availability, publication permission, user authorization and session state must remain live checks.

Before introducing shared content reuse, verify the deployed immutability guard, enforce bounded memory and tenant/release/checksum isolation, prevent mutation of cached objects, and cover withdrawal, changed permissions, failed validation and cache expiry. No shared cache has been introduced by this investigation. Full graph coverage and remaining browser latency are unfinished.
