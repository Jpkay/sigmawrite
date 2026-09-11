# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5131 selected draft/repaired question versions, 238 canonically reviewed questions, 5354 mapped questions.

288 of 542 targets have allocated initial and follow-up pools; 254 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

219 lessons and 1204 guided exercises are pinned as published_pending_review. 201 lesson targets have allocated initial/follow-up pools; 201 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 201-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:d2523322bc158974612359b4b8a7b5c997976605bf2163f19b82a42572003a15.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
