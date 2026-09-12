# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5463 selected draft/repaired question versions, 238 canonically reviewed questions, 5686 mapped questions.

290 of 542 targets have allocated initial and follow-up pools; 252 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

251 lessons and 1416 guided exercises are pinned as published_pending_review. 233 lesson targets have allocated initial/follow-up pools; 233 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 4 prerequisite targets in their 237-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:8b469fad82d70367e103e50a4ccc8b3bc8881a4a8165700baa82028ceff3d13c.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
