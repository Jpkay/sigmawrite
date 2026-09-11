# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4647 selected draft/repaired question versions, 238 canonically reviewed questions, 4870 mapped questions.

268 of 542 targets have allocated initial and follow-up pools; 274 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

177 lessons and 966 guided exercises are pinned as published_pending_review. 159 lesson targets have allocated initial/follow-up pools; 157 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 157-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:8ecc95ca13f8e74dc39aab5af70c565819c4851a7002bf77def6eb4684f2d93d.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
