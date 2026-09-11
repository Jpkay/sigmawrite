# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4811 selected draft/repaired question versions, 238 canonically reviewed questions, 5034 mapped questions.

283 of 542 targets have allocated initial and follow-up pools; 259 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

192 lessons and 1044 guided exercises are pinned as published_pending_review. 174 lesson targets have allocated initial/follow-up pools; 172 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 172-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:c5cc165670dc26080306d52d8675c4fdc23c8ca11052228672d13e5e05975174.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
