#!/usr/bin/env bash
# build.sh — Build frontend and backend for production.
# Run from the project root: ./scripts/build.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Dependency check ──────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1   || { echo "ERROR: node is not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 is not installed."; exit 1; }
command -v docker >/dev/null 2>&1  || { echo "WARNING: docker not found — skipping image build."; SKIP_DOCKER=1; }

SKIP_DOCKER="${SKIP_DOCKER:-0}"

echo "======================================================"
echo " Stock Market Trends — Production Build"
echo "======================================================"

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "[1/3] Building frontend..."
cd "$REPO_ROOT/frontend"
npm ci --prefer-offline
npm run build
echo "      Output: frontend/dist/"

# ── Backend: validate dependencies ────────────────────────────────────────────
echo ""
echo "[2/3] Validating backend dependencies..."
cd "$REPO_ROOT/backend"
pip install --quiet -r requirements.txt
echo "      Dependencies OK."

# ── Docker images ─────────────────────────────────────────────────────────────
if [ "$SKIP_DOCKER" = "0" ]; then
  echo ""
  echo "[3/3] Building Docker images..."
  cd "$REPO_ROOT"

  docker build \
    -t stock-market-trends/frontend:latest \
    -f frontend/Dockerfile \
    ./frontend
  echo "      Built: stock-market-trends/frontend:latest"

  docker build \
    -t stock-market-trends/backend:latest \
    -f backend/Dockerfile \
    ./backend
  echo "      Built: stock-market-trends/backend:latest"
else
  echo ""
  echo "[3/3] Skipping Docker image build (docker not available)."
fi

echo ""
echo "======================================================"
echo " Build complete."
echo " Run 'docker compose up' to start the stack."
echo "======================================================"
