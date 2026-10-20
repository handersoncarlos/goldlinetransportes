#!/bin/zsh
# Build de teste em dist-test/ com um GTM_ID fictício (para o teste de consentimento do verify:func).
# O config.js é restaurado no fim, mesmo se o build falhar. Uso: SITE_BASE=/ scripts/build-test.sh
set -e
cd "$(dirname "$0")/.."
BACKUP=$(mktemp)
cp src/js/config.js "$BACKUP"
trap 'cp "$BACKUP" src/js/config.js; rm -f "$BACKUP"' EXIT
sed -i '' "s/^export const GTM_ID = '';/export const GTM_ID = 'GTM-TESTE00';/" src/js/config.js
SITE_BASE=${SITE_BASE:-/} OUT_DIR=dist-test npx vite build >/dev/null 2>&1
SITE_BASE=${SITE_BASE:-/} OUT_DIR=dist-test node scripts/postbuild.mjs >/dev/null
