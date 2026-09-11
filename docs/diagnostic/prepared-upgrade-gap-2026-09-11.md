# Prepared revision 11 upgrade audit

The read-only audit against published v10 and completed QA session `d0573294-c792-46ef-94d4-62d4ae3c8fd1` rejects transfer to the 193-target revision 11 preparation. No student session was modified.

All historical items, probes, skills and activity destinations remain unchanged, and no supported target was removed. However, 88 existing lessons have changed exposure bindings as newly available questions enter the scoped bank. For example, the passé composé lesson for aller now also marks the newly scoped bare futur proche forms as exposed. Its instructional text and exercises are unchanged.

The current compatibility contract requires identical lessons, including exposure bindings. This rejection must not be bypassed by simply ignoring that field: a safe transfer must preserve all old exposure restrictions and conservatively extend historical material receipts to new questions. Newly scoped computed probes also require validation against their original bank entries rather than assuming probe IDs always equal item keys.

Before allowing this upgrade, implement and test additive exposure compatibility and receipt preservation, including rejection of removed restrictions, changed teaching, changed answers and unbacked probes. Then rerun the read-only preservation audit and a real completed-student upgrade journey.

The audit itself now checks the actual `activeSeconds` field and rejects absent or non-finite measurements. Its preservation field list is checked against the assessment session type, preventing a misspelled field from silently comparing two undefined values.

The separate frozen 172-target v11 candidate is not changed by this investigation. Its full browser journey continues separately.
