# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5035 selected draft/repaired question versions, 238 canonically reviewed questions, 5258 mapped questions.

288 of 542 targets have allocated initial and follow-up pools; 254 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

211 lessons and 1148 guided exercises are pinned as published_pending_review. 193 lesson targets have allocated initial/follow-up pools; 193 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 193-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:3f5eb32bd73448b86f7428e9674151aa6c31ce29a0a01a26b66fc06dbbb71dde.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
