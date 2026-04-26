#!/usr/bin/env bash
# One-step launcher for the Automated Compliance Monitor.
#
#   ./run.sh             start backend + frontend (Docker if available, else local)
#   ./run.sh test        run backend tests + frontend type-check
#   ./run.sh eval        run the eval harness
#   ./run.sh demo        run the headless demo (offline, no API key)
#   ./run.sh stop        stop docker compose services
#
# Defaults to USE_CLAUDE=false so the project runs out-of-the-box without
# an Anthropic API key. Export ANTHROPIC_API_KEY=sk-ant-... USE_CLAUDE=true
# to enable the agent loop.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

cmd="${1:-up}"

have() { command -v "$1" >/dev/null 2>&1; }

ensure_python_venv() {
  if [[ ! -d backend/.venv ]]; then
    echo "[run] creating Python venv…"
    python3 -m venv backend/.venv
    backend/.venv/bin/pip -q install -r backend/requirements.txt
  fi
}

ensure_node_modules() {
  if [[ ! -d frontend/node_modules ]]; then
    echo "[run] installing frontend deps…"
    (cd frontend && npm install --no-audit --no-fund --silent)
  fi
}

case "$cmd" in
  up|"")
    if have docker && docker compose version >/dev/null 2>&1; then
      echo "[run] using docker compose"
      USE_CLAUDE="${USE_CLAUDE:-false}" docker compose up --build
    else
      echo "[run] Docker not available — running natively"
      ensure_python_venv
      ensure_node_modules
      echo "[run] starting backend on :8000 and frontend on :3000…"
      (cd backend && USE_CLAUDE="${USE_CLAUDE:-false}" .venv/bin/uvicorn app.main:app --port 8000) &
      BACKEND_PID=$!
      trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT
      (cd frontend && npm run dev)
    fi
    ;;

  test)
    ensure_python_venv
    echo "[run] backend tests…"
    (cd backend && .venv/bin/python -m pytest tests/ -q)
    ensure_node_modules
    echo "[run] frontend type-check + build…"
    (cd frontend && npm run build)
    ;;

  eval)
    ensure_python_venv
    (cd backend && .venv/bin/python -m evals.run "${@:2}")
    ;;

  demo)
    ./scripts/demo.sh
    ;;

  stop)
    if have docker && docker compose version >/dev/null 2>&1; then
      docker compose down
    fi
    pkill -f 'uvicorn app.main' 2>/dev/null || true
    pkill -f 'next dev' 2>/dev/null || true
    ;;

  *)
    echo "usage: $0 [up|test|eval|demo|stop]" >&2
    exit 1
    ;;
esac
