# LanguageTool

The writing layer uses a self-hosted LanguageTool HTTP service. For local use,
set `LANGUAGETOOL_URL=http://localhost:8010` and a random 64-character hexadecimal
`LANGUAGETOOL_API_KEY` in `.env.local`, then start the tested service image with
`docker compose --env-file .env.local -f docker-compose.languagetool.yml up -d --build`.
The same key must be available to the Next.js server and the container.

## Hosted pilot

The web app stays on Vercel. The grammar container runs on the existing Hetzner
host `hetzner` (46.225.120.145, Nuremberg), at `/opt/sigmawrite-grammar`.
It is limited to one CPU and 2 GB RAM, with a 1 GB Java heap, no additional
swap, dropped capabilities and no published host port. The existing Caddy
container `sovgraph-caddy` connects to the separate `sigmawrite_grammar` network
and serves `https://grammar.trouvetaplume.com` with automatic HTTPS.
The DNS A record is DNS-only; traffic goes directly to the Hetzner HTTPS gateway.
No additional Hetzner server is required for this pilot.

The source is `infra/languagetool/compose.hetzner.yml`. The checker stays running
and warms both default and picky French modes before exposing readiness.
The engine allows 60 seconds for initial pipeline construction; the private
nginx gateway still limits student requests to nine seconds and the app to ten.
Pipelines are cached for reuse. LanguageTool 6.6 retains idle pipelines in its
pool; its legacy expiration setting is unused. Java 17 is explicitly installed.

The app uses these server-only Vercel production variables:

- `LANGUAGETOOL_URL=https://grammar.trouvetaplume.com`
- `LANGUAGETOOL_API_KEY`: the same 64-character hexadecimal key stored in
  `/opt/sigmawrite-grammar/.env` (root-only, mode 600).

The nginx gateway requires the bearer key for `POST /v2/check`; other application
paths are closed. `/healthz` verifies the upstream language endpoint. Request
access logging is disabled, and student text travels in the HTTPS POST body.
The service returns annotations after explicit submission and never rewrites
what the student typed. No typing-box integration is installed.

## Deployment and recovery

The **Deploy grammar service** workflow deploys changes on `develop` and supports
manual dispatch. The `sigmawrite-deploy` account uses a forced SSH command and
cannot open an interactive shell or forward ports. It can invoke only the
root-owned `/usr/local/sbin/sigmawrite-grammar-deploy`, installed from
`infra/languagetool/deploy-hetzner.sh`. The command reads one commit hash, fetches
it from the fixed public repository, builds the grammar image, and waits for
container health. Deployments are serialized. CI then checks public HTTPS,
authentication, and correct/incorrect synthetic French sentences.

GitHub configuration:

- Secret `SIGMAWRITE_GRAMMAR_SSH_KEY`: dedicated restricted deployment key.
- Secret `SIGMAWRITE_GRAMMAR_KNOWN_HOSTS`: host key obtained over existing trusted SSH.
- Secret `SIGMAWRITE_GRAMMAR_API_KEY`: checker key for the smoke test.
- Variable `SIGMAWRITE_GRAMMAR_HOST`: Hetzner host address.

To deploy or restore a known-good committed version, send its full SHA on stdin
through the restricted SSH account, or run the helper as root on the server.
`/opt/sigmawrite-grammar/current-release` records the last healthy deployment.
The helper itself is installed separately; editing it in Git does not silently
replace the root-owned host command. Docker images are retained for recovery.

Caddy's site block is stored in `infra/languagetool/Caddyfile.hetzner` and appended
to `/opt/sovgraph/deploy/Caddyfile` on the shared host. Preserve it when updating
that file. Caddy 2.11 can reload this file with `docker kill --signal=USR1
sovgraph-caddy`; validate its configuration first. The deploy helper reconnects
Caddy to the grammar network if the gateway container was recreated.
That connection uses gateway priority 1: the older gateway network has missing
Docker forwarding rules on this host, while the grammar network has working
outbound routing for certificate renewal. Builds use host networking for package
downloads; the running checker remains on its isolated Docker bridge.

Changing the Vercel endpoint or key requires redeploying the existing app.
Coordinate key rotation across the host, Vercel and the GitHub smoke-test secret.
With both service variables loaded, run `node infra/languagetool/smoke.mjs`.
Use synthetic text only. Monitor response times and host resource pressure
before expanding the school pilot; this host also runs other services.

The application uses a ten-second timeout. If the service is unavailable, the
summary still completes with the blended rubric, the evaluation is stored with
`degraded=true`, and no grammar issue is invented. Operations should alert on
repeated degraded evaluations and restore the service before reprocessing.
