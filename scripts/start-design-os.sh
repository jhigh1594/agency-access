#!/bin/bash

# Design OS Workflow Starter
# This script sets up everything you need for product planning with Design OS

set -e  # Exit on error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESIGN_OS_DIR="$PROJECT_ROOT/tools/design-os"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Design OS Workflow Starter              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Check if Design OS directory exists
if [ ! -d "$DESIGN_OS_DIR" ]; then
    echo -e "${YELLOW}⚠ Design OS not found at $DESIGN_OS_DIR${NC}"
    echo "Please run the setup first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "$DESIGN_OS_DIR/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Design OS dependencies...${NC}"
    cd "$DESIGN_OS_DIR"
    npm install
fi

# Start Design OS dev server in background
echo -e "${GREEN}🚀 Starting Design OS dev server...${NC}"
cd "$DESIGN_OS_DIR"
npm run dev > /tmp/design-os-server.log 2>&1 &
DEV_SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1 || curl -s http://localhost:5174 > /dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

# Determine which port it's running on
DESIGN_OS_PORT=5173
if curl -s http://localhost:5174 > /dev/null 2>&1; then
    DESIGN_OS_PORT=5174
fi

echo -e "${GREEN}✅ Design OS is running at http://localhost:${DESIGN_OS_PORT}${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📝 Available Design OS Commands (run in Claude Code):${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}/product-vision${NC}     — Define your product vision"
echo -e "  ${GREEN}/product-roadmap${NC}    — Break product into sections"
echo -e "  ${GREEN}/data-model${NC}         — Define core entities"
echo -e "  ${GREEN}/design-tokens${NC}      — Choose colors & typography"
echo -e "  ${GREEN}/design-shell${NC}       — Design navigation & layout"
echo -e "  ${GREEN}/shape-section${NC}      — Define section specifications"
echo -e "  ${GREEN}/sample-data${NC}        — Generate sample data"
echo -e "  ${GREEN}/design-screen${NC}      — Create screen designs"
echo -e "  ${GREEN}/export-product${NC}     — Generate implementation package"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Open the browser (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}🌐 Opening Design OS in your browser...${NC}"
    sleep 1
    open "http://localhost:${DESIGN_OS_PORT}"
fi

# Start Claude Code in the Design OS directory
echo -e "${GREEN}🤖 Starting Claude Code in Design OS directory...${NC}"
echo ""
echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}You're now in the Design OS workspace!${NC}"
echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
echo ""

# Change to Design OS directory for Claude Code
cd "$DESIGN_OS_DIR"

# Store the PID for cleanup
echo $DEV_SERVER_PID > /tmp/design-os-dev-server.pid

# Start Claude Code
claude

# Cleanup: Kill the dev server when Claude exits
echo ""
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
kill $DEV_SERVER_PID 2>/dev/null || true
rm -f /tmp/design-os-dev-server.pid
echo -e "${GREEN}✅ Design OS server stopped${NC}"
