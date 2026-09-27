# Revision five adaptive routing audit

## Live result

The public browser run on `app.trouvetaplume.com` stopped at its verification bound of 140 answers without selecting either `produire_passe_compose` or `produire_plus_que_parfait`. This is a failed compound-production routing smoke test, not a completed diagnostic or successful pause/reload verification.

Session: `e90a5cf0-2119-464d-bd8c-3940db77bbe4`.
Release: `42042122-9ecd-4214-a906-53583bec3d01`, 154 supported targets.
At answer 122 the persisted state contained 35 sampled skills. Auxiliary choice with avoir had four correct observations; compound-tense production and passé-composé recognition were still untested. The browser process exited with code 1 after answer 140. No answers were reset or invented. The session remains available for inspection; the application’s own time budget had not been claimed as completed.

## Why more questions alone is insufficient

The selector balances domains, strands and verb families, then gives a branch a six-question visit. It normally confirms the current target before stepping up. A visit can therefore spend its questions on present and future forms before rotating among other verbs. When several targets share a challenge rank, generic tie-breakers, including expected duration and stable identifiers, do not guarantee variety across simple and compound tenses.

A synthetic all-correct replay using the prepared 158-target graph and expected question durations used the full 35-minute budget in 61 questions, sampled 20 skills, and selected no compound-production question. It used simulated material receipts and did not test live grading or database persistence.

An experimental early-challenge rule passed small branch tests but still failed to sample a compound-production target in that full-graph replay. With the graph’s actual context definitions it sampled 21 skills instead of 20, still without compound production. The experiment was removed; production and the committed selector are unchanged. A passing small test is not sufficient evidence for this routing requirement.

## Required next change

Make conjugation sampling explicitly account for the available tense/form families within the approved graph, alongside individual verbs and patterns. Validate broad all-correct and mixed profiles against the full release, not just a three-target fixture. Preserve bounded time, step-down and boundary rechecks, per-target uncertainty, material freshness and the distinction between exploratory questions and mastery evidence. Preserve existing release and session data. Do not silently infer that an untested tense is mastered from another tense.

The pending publication evidence must continue to show compound-production live verification as incomplete. The separate demo-account checks remain valid; this finding concerns granular diagnostic routing.
