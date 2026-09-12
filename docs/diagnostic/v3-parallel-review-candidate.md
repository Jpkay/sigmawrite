# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6861 selected draft/repaired question versions, 238 canonically reviewed questions, 7076 mapped questions.

354 of 542 targets have allocated initial and follow-up pools; 188 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

348 lessons and 1934 guided exercises are pinned as published_pending_review. 334 lesson targets have allocated initial/follow-up pools; 334 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 6 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:ae0bf5c21011641211de62a214aee1e509a102f7c5ea47e4c4adf30cc84e2f48.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 34; append --check to verify without writing.
