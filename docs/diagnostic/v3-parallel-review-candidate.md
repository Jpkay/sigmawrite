# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4739 selected draft/repaired question versions, 238 canonically reviewed questions, 4962 mapped questions.

277 of 542 targets have allocated initial and follow-up pools; 265 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

186 lessons and 1010 guided exercises are pinned as published_pending_review. 168 lesson targets have allocated initial/follow-up pools; 166 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 166-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:261fbfad9e071339e8abc82ac7fbd8594c57b19eff350f25c77898c8099ec347.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
