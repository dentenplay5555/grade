#!/usr/bin/env bash
# =============================================================================
# Stop all Guarding Grader Services
# =============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[*] Stopping Caddy..."
if [ -f "$PROJECT_ROOT/logs/caddy.pid" ]; then
    kill $(cat "$PROJECT_ROOT/logs/caddy.pid") 2>/dev/null || true
    rm -f "$PROJECT_ROOT/logs/caddy.pid"
fi
pkill -f "caddy run" 2>/dev/null || true

echo "[*] Stopping Worker..."
if [ -f "$PROJECT_ROOT/logs/worker.pid" ]; then
    kill $(cat "$PROJECT_ROOT/logs/worker.pid") 2>/dev/null || true
    rm -f "$PROJECT_ROOT/logs/worker.pid"
fi
pkill -f "worker/worker.py" 2>/dev/null || true

echo "[*] Stopping FastAPI Backend..."
if [ -f "$PROJECT_ROOT/logs/backend.pid" ]; then
    kill $(cat "$PROJECT_ROOT/logs/backend.pid") 2>/dev/null || true
    rm -f "$PROJECT_ROOT/logs/backend.pid"
fi
pkill -f "uvicorn app.main:app" 2>/dev/null || true

echo "[*] Stopping Redis Server..."
redis-cli shutdown 2>/dev/null || true

echo "=================================================="
echo " 🛑 All Guarding Grader services stopped."
echo "=================================================="
