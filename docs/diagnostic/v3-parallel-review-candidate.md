# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6401 selected draft/repaired question versions, 238 canonically reviewed questions, 6616 mapped questions.

332 of 542 targets have allocated initial and follow-up pools; 210 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

329 lessons and 1819 guided exercises are pinned as published_pending_review. 311 lesson targets have allocated initial/follow-up pools; 311 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 28 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:b2947d0a5ff86b258ed19ebd3833bf00049ba401b49351a4b7fb5a3e0269d38e.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 26; append --check to verify without writing.
