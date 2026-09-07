#!/bin/bash
set -euo pipefail

# Restrict the alphabet before substituting the secret into nginx syntax.
if [[ ! "${LANGUAGETOOL_API_KEY:-}" =~ ^[a-f0-9]{64}$ ]]; then
  echo "LANGUAGETOOL_API_KEY must be a 64-character hexadecimal secret." >&2
  exit 1
fi
envsubst '${LANGUAGETOOL_API_KEY}' < /service/nginx.conf.template > /tmp/nginx.conf
chmod 600 /tmp/nginx.conf

children=()
cleanup() { kill "${children[@]}" 2>/dev/null || true; }
trap cleanup EXIT
trap 'exit 0' TERM INT
bash /LanguageTool/start.sh &
children+=("$!")

# Load the French rules before exposing readiness. The first Java check can
# take longer than an ordinary submission, especially after a machine restart.
ready=false
for attempt in {1..12}; do
  if curl --fail --silent --max-time 10 \
    --data-urlencode 'language=fr' --data-urlencode 'level=picky' \
    --data-urlencode 'text=Les enfants jouent dans la cour.' \
    http://127.0.0.1:8010/v2/check > /dev/null; then
    ready=true
    break
  fi
  kill -0 "${children[0]}" 2>/dev/null || exit 1
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo "French grammar service did not become ready." >&2
  exit 1
fi
nginx -e /dev/stderr -c /tmp/nginx.conf -g 'daemon off;' &
children+=("$!")
wait -n "${children[@]}"
