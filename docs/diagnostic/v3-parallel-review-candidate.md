# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

3509 selected draft/repaired question versions, 238 canonically reviewed questions, 3732 mapped questions.

247 of 542 targets have allocated initial and follow-up pools; 295 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

72 lessons and 379 guided exercises are pinned as published_pending_review. 68 lesson targets have allocated initial/follow-up pools; 66 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 66-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:3b891d661396028458292a2d90b75341955927fb560cda293e988bdda472d5eb.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
