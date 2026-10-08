#!/usr/bin/env bash
# =============================================================================
# Stop all Guarding Grader Services
# =============================================================================

echo "[*] Stopping Caddy..."
if [ -f logs/caddy.pid ]; then
    kill $(cat logs/caddy.pid) 2>/dev/null || true
    rm -f logs/caddy.pid
fi
pkill -f "caddy run" 2>/dev/null || true

echo "[*] Stopping Worker..."
if [ -f logs/worker.pid ]; then
    kill $(cat logs/worker.pid) 2>/dev/null || true
    rm -f logs/worker.pid
fi
pkill -f "worker/worker.py" 2>/dev/null || true

echo "[*] Stopping FastAPI Backend..."
if [ -f logs/backend.pid ]; then
    kill $(cat logs/backend.pid) 2>/dev/null || true
    rm -f logs/backend.pid
fi
pkill -f "app.main:app" 2>/dev/null || true

echo "[*] Stopping Redis Server..."
redis-cli shutdown 2>/dev/null || true

echo "=================================================="
echo " 🛑 All Guarding Grader services stopped."
echo "=================================================="
