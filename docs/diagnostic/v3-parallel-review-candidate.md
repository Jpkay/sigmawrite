# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5875 selected draft/repaired question versions, 238 canonically reviewed questions, 6091 mapped questions.

299 of 542 targets have allocated initial and follow-up pools; 243 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

278 lessons and 1578 guided exercises are pinned as published_pending_review. 260 lesson targets have allocated initial/follow-up pools; 260 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 260-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:5a24f60b0b9b976a6b8b4d0d4e9d288eaed75a9ef2fc58c83b6fece79a6e0673.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
