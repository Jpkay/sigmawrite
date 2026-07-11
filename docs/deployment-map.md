# Deployment map

| Environment | Supabase | Vercel | Promotion |
|---|---|---|---|
| Local | CLI stack on ports 55321/55322 | `next dev` | developer only |
| Hosted pilot staging | `sigmawrite-staging` / `pwztnrirtrnicywvdbpz` | `jpkays-projects/sigmawrite` at `sigmawrite.vercel.app` | deployed and smoke-tested; workflow automation next |
| Production data | `reading-to-learn` / `tkasvcccucpsbjywgdyl` | separate protected target not yet promoted | protected manual `workflow_dispatch` after human gates |

GitHub environments hold distinct Supabase/Vercel secrets. The deployment
workflow always runs application checks, applies numbered migrations, builds a
Vercel prebuilt artifact, and deploys it. Production is never linked from a
developer workstation during normal release work.

The hosted Vercel target currently contains only staging Supabase credentials;
it does not touch production data. Its build, public/manifest routes, teacher
login and authenticated cron boundary were smoke-tested on 2026-07-10. Before
enabling production promotion, install the environment-specific values listed
in [`launch-gates.md`](./launch-gates.md).
