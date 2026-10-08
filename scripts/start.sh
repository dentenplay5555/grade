#!/usr/bin/env bash
# =============================================================================
# Start all Guarding Grader Services (Redis, FastAPI, Worker, Caddy)
# =============================================================================
mkdir -p logs

echo "[1/4] Starting Redis Server on 127.0.0.1:6379..."
redis-server --bind 127.0.0.1 --port 6379 --daemonize yes || echo "Redis might already be running"

echo "[2/4] Starting FastAPI Backend on 127.0.0.1:8000..."
nohup python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 > logs/backend.log 2>&1 &
echo $! > logs/backend.pid

echo "[3/4] Starting Grader Worker..."
nohup python worker/worker.py > logs/worker.log 2>&1 &
echo $! > logs/worker.pid

echo "[4/4] Starting Caddy Reverse Proxy on :8080..."
nohup caddy run --config caddy/Caddyfile > logs/caddy.log 2>&1 &
echo $! > logs/caddy.pid

IP=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d: -f2 | head -n 1 || hostname -I | awk '{print $1}')
echo "=================================================="
echo " 🛡️ Guarding Grader is LIVE!"
echo " Student Web:  http://${IP:-127.0.0.1}:8080/"
echo " Admin Web:    http://${IP:-127.0.0.1}:8080/admin/"
echo " Backend Logs: tail -f logs/backend.log"
echo " Worker Logs:  tail -f logs/worker.log"
echo " To stop:      ./scripts/stop.sh"
echo "=================================================="
