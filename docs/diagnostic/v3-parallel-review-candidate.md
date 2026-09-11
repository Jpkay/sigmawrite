# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4263 selected draft/repaired question versions, 238 canonically reviewed questions, 4486 mapped questions.

265 of 542 targets have allocated initial and follow-up pools; 277 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

132 lessons and 728 guided exercises are pinned as published_pending_review. 128 lesson targets have allocated initial/follow-up pools; 126 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 126-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:e80e0b2f424c3661aabd10ffd77b96294fc1b4417a46e9177271275379b09fc4.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
