# Mastery spiral v3

SigmaWrite separates **readiness** from **mastery**.

- Below 0.45 mastery, a six-activity plan reserves about five activities for review and one for forward movement.
- From 0.45 to 0.64, it uses roughly four reviews and two new activities.
- From 0.65 to 0.84, the next graph node is available, but the earlier node remains unfinished and receives roughly half of the available attention when due.
- At 0.85 or above, matching unaided evidence can complete the node. FSRS still schedules later retrieval because demonstrated mastery is not permanent storage.

The memory scheduler uses the maintained `ts-fsrs` FSRS-6 implementation, its 21 default parameters, and 90% desired retention. A forgotten response is recorded as `Again`; a correct response with help is `Hard`; an unaided correct response is `Good`. This distinction protects retrieval evidence from hints while allowing hints to support learning.

The policy follows the official Open Spaced Repetition guidance that difficulty, stability and retrievability should drive review intervals, while desired retention controls workload. Default parameters remain in use until SigmaWrite has enough learner review histories for responsible per-population optimization.
