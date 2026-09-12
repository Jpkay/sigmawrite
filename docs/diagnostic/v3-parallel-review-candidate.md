# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

6581 selected draft/repaired question versions, 238 canonically reviewed questions, 6796 mapped questions.

339 of 542 targets have allocated initial and follow-up pools; 203 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

332 lessons and 1846 guided exercises are pinned as published_pending_review. 318 lesson targets have allocated initial/follow-up pools; 318 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 21 prerequisite targets in their 360-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:77ed605d559c18bb68eb2aa7be32c2dfdc93b14e05b823d6bb20bf929096d055.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts --bank-revision 27; append --check to verify without writing.
