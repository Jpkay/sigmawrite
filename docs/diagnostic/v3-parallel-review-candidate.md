# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5921 selected draft/repaired question versions, 238 canonically reviewed questions, 6136 mapped questions.

300 of 542 targets have allocated initial and follow-up pools; 242 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

279 lessons and 1585 guided exercises are pinned as published_pending_review. 261 lesson targets have allocated initial/follow-up pools; 261 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 261-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:9f6751c9c7d8f1db531d579105aa562bee11155ab6d92cfdd049e5bcd068cd25.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
