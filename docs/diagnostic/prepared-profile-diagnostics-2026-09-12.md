# Real-content diagnostic profile verification

The prepared 237-target candidate was exercised with eight constructed profiles using its actual questions, server grading, material delivery receipts and learning commands. Each run reached the 35-minute active-time limit (61 questions with estimated item durations), preserved a three-hour pause without charging it, and produced a provisional map across all 542 graph targets. Untested targets remained unknown.

| Constructed contrast | Lesson reached | Prerequisite checks after diagnostic |
| --- | --- | --- |
| Regular patterns versus irregular verbs | Aller in the present | 3 |
| Uneven verb-specific tense knowledge | Avoir in the futur proche | 1 |
| Explicit information versus inference | Understanding why a character acts | 1 |
| Reading with a pronoun-reference gap | Finding what le, la or lui replaces | 0 |
| Direct versus indirect object pronouns | Referring to several people with leur | 0 |
| Lexical spelling stronger than agreement | Forming a feminine adjective | 0 |
| Agreement stronger than lexical spelling | Choosing on or om | 0 |
| Recognition stronger than production | Changing endings of verbs like parler | 6 |

Each profile must produce sufficient within-sitting evidence for at least one expected strength and one expected weakness in its specified area. The uneven-tense profile must demonstrate both within one verb branch. Every resolved target must point in the direction of the constructed knowledge, and the selected lesson must address an expected weakness. Independent checks preserve the original diagnostic answers. Final results and activities must survive a session reload unchanged.

This is deliberately a minimum discrimination check, not proof that all the profile’s known and unknown skills were assessed. The JSON report retains every unresolved target. The initial diagnostic cannot confirm the entire graph within one sitting; learning must continue assessment.

## Reproduction

```sh
node --import tsx scripts/verify-prepared-profile-diagnostics.mts --require-discrimination --require-pathway
npx tsc --noEmit
```

See the adjacent JSON for candidate and engine checksums, sampled targets, remaining uncertainty and exact follow-up questions. The fixture uses an explicitly empty synthetic presentation history and advances a simulated clock by estimated question durations. It does not write to the database, prove browser behavior, validate reading duration, or establish educational calibration. Its prerequisite answers follow the constructed profile truth; these checks are not lesson completion. The separate live candidate journey verifies browser behavior and actual persistence.
