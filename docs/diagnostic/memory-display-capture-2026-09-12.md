# Memory display capture

The memory route now records fixed copy before returning its client component and keys the component to the authenticated owner. It includes local grading labels, accent controls, empty states and the existing retry message. Shared formatters render and record due-card counts, counts by concept and vocabulary encounter labels. Each recorded student-state reply covers the count states reachable as its cards are rescheduled; it does not infer competency mastery from those counts.

The same projection is used for ordinary state loads and granular diagnostic responses that include student state. Rendering tests retain the distinction between card inventory and mastery. New tests cover count bounds, owner keys, unauthorized requests and capture failure. Existing delivery fixtures were expanded to include their real concept-label and vocabulary fields. TypeScript passes; 431 files and 1,844 tests pass.

Not yet deployed. No review answers were submitted to a production memory account. Old-client/global-error guarantees and the remaining activity-page inventory are still unresolved; no full-history contract is enabled.
