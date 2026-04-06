#!/usr/bin/env bash
# dev.sh — Start frontend and backend development servers concurrently.
# Run from the project root: ./scripts/dev.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Dependency check ──────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1  || { echo "ERROR: node is not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 is not installed."; exit 1; }

# ── Cleanup on exit ───────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Stopping dev servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

# ── Backend ───────────────────────────────────────────────────────────────────
echo "Starting backend on http://localhost:8000 ..."
cd "$REPO_ROOT/backend"

# Load .env if present
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "Starting frontend on http://localhost:5173 ..."
cd "$REPO_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

# ── Wait ──────────────────────────────────────────────────────────────────────
echo ""
echo "Dev servers running:"
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:8000"
echo "  API docs : http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop."
wait
