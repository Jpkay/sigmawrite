# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5743 selected draft/repaired question versions, 238 canonically reviewed questions, 5964 mapped questions.

294 of 542 targets have allocated initial and follow-up pools; 248 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

269 lessons and 1520 guided exercises are pinned as published_pending_review. 251 lesson targets have allocated initial/follow-up pools; 251 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 2 prerequisite targets in their 253-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:360ccdcdc292f7a863854afc4974291e1b85a36057b01bc83acd8cd88db5fc9c.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
