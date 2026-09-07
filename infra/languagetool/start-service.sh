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
nginx -c /tmp/nginx.conf -g 'daemon off;' &
children+=("$!")
wait -n "${children[@]}"
