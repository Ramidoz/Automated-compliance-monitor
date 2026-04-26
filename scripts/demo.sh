#!/usr/bin/env bash
# Reproducible demo run.
#
# Boots the backend (Claude OFF for determinism), scans both fixtures,
# saves the raw JSON to demo/results/, and prints a summary table.
# No API key needed.
#
# Usage:  ./scripts/demo.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
OUT="$ROOT/demo/results"
PORT=8765

mkdir -p "$OUT"

if [[ ! -d "$BACKEND/.venv" ]]; then
  echo "[demo] creating venv + installing deps…"
  python3 -m venv "$BACKEND/.venv"
  "$BACKEND/.venv/bin/pip" -q install -r "$BACKEND/requirements.txt"
fi

cleanup() {
  if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  fi
  rm -f "$BACKEND/demo.db"
}
trap cleanup EXIT

echo "[demo] starting backend on :$PORT…"
(
  cd "$BACKEND" && \
  USE_CLAUDE=false \
  DATABASE_URL="sqlite+aiosqlite:///./demo.db" \
  .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$PORT" --log-level warning
) &
PID=$!

# Wait for /api/health
for _ in $(seq 1 40); do
  if curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then break; fi
  sleep 0.25
done
if ! curl -fs "http://127.0.0.1:$PORT/api/health" >/dev/null; then
  echo "[demo] backend failed to start" >&2
  exit 1
fi

scan() {
  local fixture="$1" out="$2"
  echo "[demo] scanning $fixture…"
  curl -fs -X POST "http://127.0.0.1:$PORT/api/scan" \
    -F "frameworks=HIPAA,GDPR,PCI_DSS,SOC2" \
    -F "file=@$BACKEND/fixtures/$fixture" \
    -o "$out"
}

scan clinic_policy_weak.txt   "$OUT/weak.json"
scan saas_policy_strong.txt   "$OUT/strong.json"

python3 - "$OUT/weak.json" "$OUT/strong.json" <<'PY'
import json, sys
from pathlib import Path
print()
print("| Fixture | Risk | Label | Findings | Failed |")
print("|---|---:|---|---:|---:|")
for path in sys.argv[1:]:
    d = json.loads(Path(path).read_text())
    failed = sum(1 for f in d["findings"] if f["status"] in ("missing","violation","weak","contradiction"))
    print(f"| `{Path(path).stem}.json` | {d['risk_score']:.1f} | {d['risk_label']} | {len(d['findings'])} | {failed} |")
print()
PY

echo "[demo] artifacts saved under demo/results/"
