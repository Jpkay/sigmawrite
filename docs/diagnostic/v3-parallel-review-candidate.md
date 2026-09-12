# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6649 selected draft/repaired question versions, 238 canonically reviewed questions, 6864 mapped questions.

343 of 542 targets have allocated initial and follow-up pools; 199 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

336 lessons and 1870 guided exercises are pinned as published_pending_review. 322 lesson targets have allocated initial/follow-up pools; 322 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 17 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:2e71cd4fdf9566bd88b8d9c04ec7e770561f2be8c5f608c82c2091f491b05e0f.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 29; append --check to verify without writing.
