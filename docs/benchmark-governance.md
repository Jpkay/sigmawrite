# Gold benchmark governance

The initial SigmaWrite gold set contains exactly six passages, identified as
`GOLD-01` through `GOLD-06`.

## Eligibility

A passage can be selected only after all required reviews are submitted, an
admin resolution approves it, publication has produced an immutable
`text_version`, questions exist, and no submitted review contains an unresolved
critical factual, cultural, age, or multiple-answer issue.

## Selection

The admin selects—not the system—six passages in `/admin/benchmarks`. The screen
shows difficulty band, topic, text type, competency, average score, and agreement.
Warnings encourage at least three difficulty bands, four topics, and both
narrative and informational coverage.

Locking is a confirmed, atomic server action. It freezes the exact text-version
identifier and a snapshot of every linked question and answer. The set moves to
`locked` only after all six records are present. These version links are the
inputs for future regression jobs.

## Unlocking

Ordinary content editing cannot change a locked benchmark. A platform admin may
use the dedicated unlock action and must provide a reason. Unlocking restores
the text to `human_approved`, reopens the set, and appends an audit record while
retaining the historical benchmark row and its frozen question snapshot.

