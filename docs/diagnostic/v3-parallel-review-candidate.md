# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6849 selected draft/repaired question versions, 238 canonically reviewed questions, 7064 mapped questions.

354 of 542 targets have allocated initial and follow-up pools; 188 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

347 lessons and 1928 guided exercises are pinned as published_pending_review. 333 lesson targets have allocated initial/follow-up pools; 333 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 6 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:1d2d95c84f6b40ad52661b18eb392edcd0648e1783f3f1281b9a2a86d324d08d.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 33; append --check to verify without writing.
