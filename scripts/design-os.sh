#!/bin/bash
# Design OS - Quick start (minimal output)

cd "$(dirname "${BASH_SOURCE[0]}")/../tools/design-os"

# Start server in background if not running
if ! curl -s http://localhost:5173 > /dev/null 2>&1 && ! curl -s http://localhost:5174 > /dev/null 2>&1; then
    npm run dev > /tmp/design-os.log 2>&1 &
    echo $! > /tmp/design-os.pid
    sleep 2
fi

# Start Claude Code
exec claude
