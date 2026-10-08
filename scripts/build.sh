#!/usr/bin/env bash
# =============================================================================
# Frontend Build Script
# =============================================================================
set -e

echo "[*] Building Vite React frontend for production..."
npm run build

echo "[+] Build completed. Static assets ready in ./dist"
