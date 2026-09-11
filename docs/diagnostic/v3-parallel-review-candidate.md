# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

4755 selected draft/repaired question versions, 238 canonically reviewed questions, 4978 mapped questions.

278 of 542 targets have allocated initial and follow-up pools; 264 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

187 lessons and 1016 guided exercises are pinned as published_pending_review. 169 lesson targets have allocated initial/follow-up pools; 167 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 167-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:b4a8b3dcf9488f5c2cdef54919e1be4f1df3825dcb421af84768b25396b149c0.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
