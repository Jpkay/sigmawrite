# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

7011 selected draft/repaired question versions, 238 canonically reviewed questions, 7226 mapped questions.

355 of 542 targets have allocated initial and follow-up pools; 187 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

359 lessons and 2004 guided exercises are pinned as published_pending_review. 345 lesson targets have allocated initial/follow-up pools; 345 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 5 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:fe908acd04b0d6b673ef6fe9bc07959a8305abed0323de11d581391029446e72.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 35; append --check to verify without writing.
