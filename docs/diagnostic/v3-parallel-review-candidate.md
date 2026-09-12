# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6915 selected draft/repaired question versions, 238 canonically reviewed questions, 7130 mapped questions.

355 of 542 targets have allocated initial and follow-up pools; 187 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

351 lessons and 1956 guided exercises are pinned as published_pending_review. 337 lesson targets have allocated initial/follow-up pools; 337 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 5 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:08a07daece2582df8a69e3b01cf80c173eaa29fd8573b1a7cc0bc9f2012d0aeb.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 34; append --check to verify without writing.
