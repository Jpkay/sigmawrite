# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4663 selected draft/repaired question versions, 238 canonically reviewed questions, 4886 mapped questions.

270 of 542 targets have allocated initial and follow-up pools; 272 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

179 lessons and 978 guided exercises are pinned as published_pending_review. 161 lesson targets have allocated initial/follow-up pools; 159 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 159-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:af78774698f4808b221e46b34c10d3c4a3741d52d7f446dabea34e465294658c.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
