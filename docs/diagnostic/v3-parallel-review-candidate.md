# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

3701 selected draft/repaired question versions, 238 canonically reviewed questions, 3924 mapped questions.

249 of 542 targets have allocated initial and follow-up pools; 293 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

88 lessons and 475 guided exercises are pinned as published_pending_review. 84 lesson targets have allocated initial/follow-up pools; 82 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 82-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:7d896a3196a5defb7064f7d492c6f0082654ab70d672ff117147059bb86bb5a9.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
