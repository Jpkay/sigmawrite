# LanguageTool

The writing layer uses a self-hosted LanguageTool HTTP service. Start it with
`docker compose -f docker-compose.languagetool.yml up -d` and set
`LANGUAGETOOL_URL=http://localhost:8010` locally or to the private service URL
in staging/production.

## Hosted pilot

The hosted service is the `sigmawrite-grammar` Fly.io app in Frankfurt (`fra`).
Its deployment source is `infra/languagetool/`. It runs one shared CPU with
2 GB of memory and a 1 GB Java heap. The machine stays running to avoid Java
cold starts inside the application's ten-second request timeout.

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

Deploy updates from the service directory:

```sh
cd infra/languagetool
fly deploy --remote-only --ha=false --yes
```

Keep the same secret on Fly and Vercel. Changing a Vercel environment variable
requires a new application deployment. When rotating the key, coordinate the
service and app deployments so they do not use different credentials.

Before connecting an application release, verify that an unauthenticated check
returns 401, an authenticated correct French sentence produces no errors, and
an agreement error produces a correction. Only synthetic test text is needed.

The application uses a ten-second timeout. If the service is unavailable, the
summary still completes with the blended rubric, the evaluation is stored with
`degraded=true`, and no grammar issue is invented. Operations should alert on
repeated degraded evaluations and restore the service before reprocessing.
