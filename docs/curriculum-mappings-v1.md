# Curriculum mappings v1 (2026-09-04)

`generated/curriculum-mappings-v1.json` maps every node of the frozen v3 taxonomy to
programme references. It is built by `npm run curriculum:build`, verified by
`npm run curriculum:verify` (part of `npm run ci`) and imported with
`npm run curriculum:import` into `public.curriculum_mappings`.

The mapping is **codes only**, consistent with the register entries
`fr-bo-cycle3-2025` and `fr-bo-cycle4-current` in `docs/french-source-register.md`.
Two additional code-only references are used and carry the same limits (identifier and
SigmaWrite-authored label, no official text stored):

| Key | Source | Use |
| --- | --- | --- |
| `fr-depp-eval6e-2025` | DEPP, évaluations nationales de début de 6e (2025) | Domain codes `E6-*` for reporting alignment |
| `fr-dnb-francais` | Ministère de l’Éducation nationale, épreuve de français du DNB | Skill codes `DNB-*` for reporting alignment |

The register file itself is content-hashed into the v3 taxonomy manifest, so these entries
are documented here rather than in the register until the next taxonomy release is cut.

Rules live in `scripts/build-curriculum-mappings.mts` and are keyed on node key patterns per
strand; the file's `checksum` must match the rebuilt output.
