# LanguageTool

The writing layer uses a self-hosted LanguageTool HTTP service. For local use,
set `LANGUAGETOOL_URL=http://localhost:8010` and a random 64-character hexadecimal
`LANGUAGETOOL_API_KEY` in `.env.local`, then start the tested service image with
`docker compose --env-file .env.local -f docker-compose.languagetool.yml up -d --build`.
The same key must be available to the Next.js server and the container.

## Hosted pilot

The hosted service is the `sigmawrite-grammar` Fly.io app in Frankfurt (`fra`).
Its deployment source is `infra/languagetool/`. It runs two shared CPUs with
2 GB of memory and a 1 GB Java heap. The machine stays running to avoid Java
cold starts inside the application's ten-second request timeout.
Startup also warms the French rules using a synthetic sentence before exposing
the health endpoint. The image explicitly installs Java 17, which is required
by this LanguageTool distribution.
French checking pipelines are cached for one hour so submissions reuse the
loaded rules instead of rebuilding the checking pipeline on every request.
Native pipeline prewarming loads French before the HTTP server starts, outside
the per-submission timeout; the startup sentence then verifies readiness.

The app uses these server-only Vercel production variables:

- `LANGUAGETOOL_URL=https://sigmawrite-grammar.fly.dev`
- `LANGUAGETOOL_API_KEY`: a random 64-character hexadecimal secret, also stored
  as a Fly secret with the same name.

An nginx gateway checks the bearer secret before forwarding `POST /v2/check`
to LanguageTool. Other application paths are closed; `/healthz` checks the
upstream language endpoint without requiring a secret. Request access logging
is disabled. Student text travels in the HTTPS request body, never a URL.
The service does not rewrite the student's text: it returns annotations for
the existing submission handlers. No typing-box integration is installed.

The **Deploy grammar service** GitHub workflow deploys changes to
`infra/languagetool/` on `develop`, and supports manual dispatch. It builds on
the runner and performs the authenticated smoke check after deployment. It uses
`SIGMAWRITE_GRAMMAR_FLY_TOKEN` (a Fly deploy token scoped to this app) and
`SIGMAWRITE_GRAMMAR_API_KEY` (the same checker key). The initial deploy token
expires after 90 days; replace that repository secret before expiry.

Alternatively, deploy updates from the service directory:

```sh
cd infra/languagetool
fly deploy --remote-only --ha=false --yes
```

Keep the same checker secret on Fly, Vercel and the GitHub smoke-check secret.
Changing a Vercel environment variable
requires a new application deployment. When rotating the key, coordinate the
service and app deployments so they do not use different credentials.

Before connecting an application release, verify that an unauthenticated check
returns 401, an authenticated correct French sentence produces no errors, and
an agreement error produces a correction. Only synthetic test text is needed.
With the two service variables loaded, run `node infra/languagetool/smoke.mjs`
to exercise these checks against either the local or hosted endpoint.

The application uses a ten-second timeout. If the service is unavailable, the
summary still completes with the blended rubric, the evaluation is stored with
`degraded=true`, and no grammar issue is invented. Operations should alert on
repeated degraded evaluations and restore the service before reprocessing.
