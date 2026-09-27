# Student feedback on submitted writing

Prepared, not deployed. The student results view now shows the latest submitted writing, the exact verified passages, their correct/incorrect status, and the saved learner explanation. It identifies the skill being checked and says that later texts help confirm mastery.

Feedback is reconstructed from validated saved evidence, so it survives reload. It is omitted during an active check or guided lesson, for invalid source spans, and after a later non-writing check. It exposes neither the evaluator protocol nor private rubric metadata, and does not change evidence counts or mastery rules. The existing authenticated delivery journal records the returned text fragments before delivery; this does not establish complete exposure history.

Verification: TypeScript passed; 361 test files / 1,606 tests passed. Service tests cover saved feedback, reload, withheld feedback, ownership and malformed spans. Render tests cover the source passage, explanation, singular wording, limited mastery language and escaped student markup.

This is application code and local test evidence. No live provider journey, deployment, classroom calibration or owner approval is claimed by this report.
