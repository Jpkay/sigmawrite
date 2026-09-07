#!/bin/bash
# Installed root-owned at /usr/local/sbin/sigmawrite-grammar-deploy.
# The restricted CI SSH key can only invoke this script with a commit on stdin.
set -euo pipefail
read -r release
[[ "$release" =~ ^[a-f0-9]{40}$ ]] || { echo 'Expected a Git commit.' >&2; exit 1; }
exec 9>/run/lock/sigmawrite-grammar-deploy.lock
flock -w 300 9
cd /opt/sigmawrite-grammar/repository
git -c core.hooksPath=/dev/null fetch --depth=1 origin "$release"
git -c core.hooksPath=/dev/null checkout --detach "$release"
export GRAMMAR_RELEASE="$release"
docker compose --project-name sigmawrite-grammar \
  --env-file /opt/sigmawrite-grammar/.env \
  --file infra/languagetool/compose.hetzner.yml \
  up --detach --build --wait --wait-timeout 300
# Reconnect the shared HTTPS gateway if it was recreated by its owner.
if ! docker network inspect sigmawrite_grammar --format '{{range .Containers}}{{println .Name}}{{end}}' | grep -qx sovgraph-caddy; then
  docker network connect sigmawrite_grammar sovgraph-caddy
fi
printf '%s\n' "$release" > /opt/sigmawrite-grammar/current-release
echo "Grammar deployment ready: $release"
