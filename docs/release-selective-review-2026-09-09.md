# Selective-review deployment — 9 September 2026

The application and hourly selective-review job are live at https://app.trouvetaplume.com. Automatic publication is **disabled**; shadow evaluation is operational. The public marketing site at trouvetaplume.com is served separately through Cloudflare.

## Release and checks

- Vercel deployment: `dpl_9D2L3F4g4vSuqtk5Z97S8nbH6RrL`, promoted successfully after a successful cloud production build.
- Deployment URL: https://sigmawrite-n7x1x3tcy-jpkays-projects.vercel.app (deployment protection applies).
- Original rollback deployment: `dpl_8KLV5ZZoAZo7m48x97vsAzZbTZYP`.
- Isolated release branch: `codex/selective-review-release`. Unrelated homepage, school and diagnostic artifact edits were excluded.
- Next.js and eslint-config-next updated to 16.3.4; Vitest to 4.1.11; vulnerable transitive dependencies updated. `server-only` is explicitly installed for the operator scripts.
- 791 unit tests, TypeScript and ESLint pass. Dependency audit reports zero vulnerabilities.
- Database migrations 0135, 0136 and 0137 pass 29 behavioral assertions in rolled-back transactions. Synthetic test data was not used as calibration evidence.
- Current review database `pwztnrirtrnicywvdbpz`: migrations through 0137 applied and recorded. Separate database `tkasvcccucpsbjywgdyl` untouched.
- Live login: HTTP 200. Unauthenticated automation request: HTTP 401. Authenticated automation request: HTTP 200 with `mode=shadow` and persisted decisions for the three samples. No sample was published.

The live smoke test found that the job/publication claim functions used an obsolete single-claim authentication setting. Migration 0136 uses `auth.role()` while preserving service-only grants, claim locks and idempotency. The same authorized live request then succeeded.

QA version `selective-passage-2` permits headings without terminal full stops and tells the independent judge to reserve its concern list for actual defects. It retains body punctuation checks, question support checks and source validation. The policy remains at a 5% sample, 10% cohort, 100 sessions/text, with publication disabled.

## Fixed three-passage reference sample

All three have three multiple-choice questions and assignments for the existing JP/Astrid/Alice team. No independent human decision was created by the agent. The first two were generated with `z-ai/glm-5.2`; the third used `openai/gpt-5.4` after repeated GLM timeouts. Each generation model is recorded in its job; all three were evaluated separately by `openai/gpt-5.4-mini`.

| Reference | Review version | QA v2 result |
| --- | --- | --- |
| Pourquoi une flaque finit par sécher | `55865c7e-8b6a-40a8-9f9c-b163f360935f` | Held: length/difficulty mismatch and unsupported answer. |
| Pourquoi les ombres changent-elles de place au cours de la journée ? | `837777cd-871f-4535-9365-24f50d9e5970` | Held: grammar/punctuation finding. |
| Comment les racines aident une plante | `45533ba1-e69b-4856-be78-1cd7a7230dd7` | Held: invalid/unprovided grounding references. |

The QA v1 root passage report included invented source packet IDs. These were detected and were not treated as factual evidence. Full immutable QA reports remain in `passage_qa_runs`. The six earlier independently reviewed mixed-format references and deliberately faulty controls remain recorded as a failed v1 calibration; they were not used to enable v2.

## Remaining before automatic publication

Correct the actual defects in this small reference sample, then obtain genuine independent reference reviews and rerun the calibration script. Human reviewers may identify additional defects; automated judgments are not ground truth. The script selects six independently reviewed reference versions, prioritizes the supported format and tests two negative controls. It requires zero errors/false accepts and at least one passing reference. Only matching passed evidence can unlock the bounded pilot.

This remaining calibration is a fixed sample exercise. There is no requirement to finish all 60 historical passages, and ordinary generated texts do not all need human approval once the route is calibrated. The existing human-approved library remains available while this work continues.
