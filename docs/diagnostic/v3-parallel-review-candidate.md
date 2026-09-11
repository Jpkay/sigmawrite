# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5347 selected draft/repaired question versions, 238 canonically reviewed questions, 5570 mapped questions.

288 of 542 targets have allocated initial and follow-up pools; 254 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

237 lessons and 1320 guided exercises are pinned as published_pending_review. 219 lesson targets have allocated initial/follow-up pools; 219 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 219-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:3d11f7244df256f023349144803bfe66dc52ee6623648af7d3e4bc46c384a458.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
