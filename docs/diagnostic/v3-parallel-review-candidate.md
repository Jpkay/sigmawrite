# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4157 selected draft/repaired question versions, 238 canonically reviewed questions, 4380 mapped questions.

258 of 542 targets have allocated initial and follow-up pools; 284 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

125 lessons and 700 guided exercises are pinned as published_pending_review. 121 lesson targets have allocated initial/follow-up pools; 119 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 119-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:be17ac09e436e5df795f84fe843d9cf0579e2af70311a5cbea0d7bf611aaab90.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
