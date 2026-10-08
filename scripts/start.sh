#!/usr/bin/env bash
# =============================================================================
# Start all Guarding Grader Services (Redis, FastAPI, Worker, Caddy)
# Must be run from the project root directory (where this script lives as scripts/start.sh)
# =============================================================================
set -e

# Resolve absolute project root (directory containing this script's parent)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

mkdir -p logs

echo "[1/4] Starting Redis Server on 127.0.0.1:6379..."
redis-server --bind 127.0.0.1 --port 6379 --daemonize yes --logfile "$PROJECT_ROOT/logs/redis.log" || echo "Redis might already be running"

echo "[2/4] Starting FastAPI Backend on 127.0.0.1:8000..."
cd "$PROJECT_ROOT/backend"
nohup python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/backend.pid"
cd "$PROJECT_ROOT"

echo "[3/4] Starting Grader Worker..."
nohup python "$PROJECT_ROOT/worker/worker.py" > "$PROJECT_ROOT/logs/worker.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/worker.pid"

echo "[4/4] Starting Caddy Reverse Proxy on :8080..."
nohup caddy run --config "$PROJECT_ROOT/caddy/Caddyfile" --adapter caddyfile > "$PROJECT_ROOT/logs/caddy.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/caddy.pid"

# Detect WLAN IP (Termux compatible)
IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -n1)
IP="${IP:-$(hostname -I 2>/dev/null | awk '{print $1}')}"
IP="${IP:-127.0.0.1}"

echo "=================================================="
echo " 🛡️ Guarding Grader is LIVE!"
echo " Student Web:  http://${IP}:8080/"
echo " Admin Web:    http://${IP}:8080/admin/"
echo " Backend Logs: tail -f ${PROJECT_ROOT}/logs/backend.log"
echo " Worker Logs:  tail -f ${PROJECT_ROOT}/logs/worker.log"
echo " To stop:      ${PROJECT_ROOT}/scripts/stop.sh"
echo "=================================================="
