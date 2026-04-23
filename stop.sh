#!/bin/bash

echo "=================================="
echo "  hanimo-rag — Stopping All Services"
echo "=================================="
echo ""

cd "$(dirname "$0")"

echo "[1/2] Stopping Docker services..."
if docker compose down 2>/dev/null; then
    echo "  ✅ PostgreSQL + hanimo-rag stopped"
else
    echo "  ⚠️  Docker services not running"
fi

echo ""
echo "[2/2] Done."
echo ""
echo "  Data is preserved in Docker volume (pgdata)."
echo "  To delete all data:  docker compose down -v"
echo "  To restart:          ./start.sh"
echo ""
