#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# Termux Environment Setup Script for Guarding Grader
# =============================================================================
set -e

echo "[*] Updating Termux package repositories..."
pkg update -y && pkg upgrade -y

echo "[*] Installing required packages (Python, Clang, Redis, Caddy, Node.js)..."
pkg install -y python clang redis caddy nodejs-lts git proot

echo "[*] Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "[*] Installing Frontend NPM dependencies..."
npm install

echo "=================================================="
echo " ✅ Termux Setup Completed Successfully!"
echo " Next steps:"
echo " 1. Copy .env.example to .env and configure Supabase"
echo " 2. Run ./scripts/build.sh to build frontend"
echo " 3. Run ./scripts/start.sh to launch the platform"
echo "=================================================="
