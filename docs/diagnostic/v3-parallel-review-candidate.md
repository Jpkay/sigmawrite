# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5527 selected draft/repaired question versions, 238 canonically reviewed questions, 5748 mapped questions.

292 of 542 targets have allocated initial and follow-up pools; 250 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

253 lessons and 1424 guided exercises are pinned as published_pending_review. 235 lesson targets have allocated initial/follow-up pools; 235 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 2 prerequisite targets in their 237-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:cafcc6878e54d2fc9a85f615d7bbc933e0f953b48d5b05076271c5b2035c0bf1.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
