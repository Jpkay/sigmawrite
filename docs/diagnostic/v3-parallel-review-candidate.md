# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4763 selected draft/repaired question versions, 238 canonically reviewed questions, 4986 mapped questions.

279 of 542 targets have allocated initial and follow-up pools; 263 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

188 lessons and 1020 guided exercises are pinned as published_pending_review. 170 lesson targets have allocated initial/follow-up pools; 168 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 4 prerequisite targets in their 172-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:166d533bad5a3e2577710d61c0ec2fa3ad50e461314c888219034135696bac57.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
