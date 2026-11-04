#!/usr/bin/env sh
# Smoke test pós-deploy.  Uso: scripts/smoke.sh <URL base> [versão esperada]
# Falha (exit 1) se a API não estiver saudável, a versão não for a esperada ou o frontend não responder.
set -eu
BASE="${1:?uso: smoke.sh <url> [versao]}"; BASE="${BASE%/}"
EXPECT="${2:-}"
TRIES="${SMOKE_TRIES:-30}"; WAIT="${SMOKE_WAIT:-10}"

i=0
until BODY="$(curl -fsS --max-time 10 "$BASE/api/v1/health" 2>/dev/null)"; do
  i=$((i + 1)); [ "$i" -ge "$TRIES" ] && { echo "✖ /api/v1/health não ficou saudável"; exit 1; }
  echo "… a aguardar a API ($i/$TRIES)"; sleep "$WAIT"
done
echo "health: $BODY"

echo "$BODY" | grep -q '"status":"ok"' || { echo "✖ status != ok"; exit 1; }
echo "$BODY" | grep -q '"db":"up"'     || { echo "✖ base de dados em baixo"; exit 1; }
if [ -n "$EXPECT" ]; then
  echo "$BODY" | grep -q "\"version\":\"$EXPECT\"" || { echo "✖ versão em produção != $EXPECT"; exit 1; }
fi
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE/")"
[ "$code" = "200" ] || { echo "✖ frontend devolveu $code"; exit 1; }
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE/api/v1/public/__smoke__/components")"
[ "$code" = "404" ] || { echo "✖ API pública devolveu $code (esperado 404 para projeto inexistente)"; exit 1; }
echo "✔ smoke test OK ($BASE)"
