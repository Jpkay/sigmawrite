# Parallel-review release preparation

The product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.

5395 selected draft/repaired question versions, 238 canonically reviewed questions, 5618 mapped questions.

288 of 542 targets have allocated initial and follow-up pools; 254 remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.

245 lessons and 1376 guided exercises are pinned as published_pending_review. 227 lesson targets have allocated initial/follow-up pools; 227 retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. 0 prerequisite targets in their 227-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.

Policy checksum: sha256:108a4f57f603fea5ece246b2db55d03129249586e7248490a1131ba6162a9b0c.

Reproduce: npx tsx scripts/build-parallel-review-candidate.mts; append --check to verify without writing.
