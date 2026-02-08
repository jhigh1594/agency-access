#!/bin/bash
# Toggle project MCP servers on/off for manual lazy loading

SETTINGS_FILE=".claude/settings.json"
MODE=${1:-"toggle"}

case $MODE in
  on|enable)
    echo "🔧 Enabling project MCP servers..."
    jq '.enableAllProjectMcpServers = true' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
    echo "✅ Project MCP servers enabled. Restart Claude Code to apply."
    ;;
  off|disable)
    echo "🔧 Disabling project MCP servers..."
    jq '.enableAllProjectMcpServers = false' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
    echo "✅ Project MCP servers disabled. Restart Claude Code to apply."
    ;;
  toggle)
    CURRENT=$(jq -r '.enableAllProjectMcpServers' "$SETTINGS_FILE")
    if [ "$CURRENT" = "true" ]; then
      echo "🔧 Disabling project MCP servers..."
      jq '.enableAllProjectMcpServers = false' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
      echo "✅ Project MCP servers disabled. Restart Claude Code to apply."
    else
      echo "🔧 Enabling project MCP servers..."
      jq '.enableAllProjectMcpServers = true' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
      echo "✅ Project MCP servers enabled. Restart Claude Code to apply."
    fi
    ;;
  status)
    CURRENT=$(jq -r '.enableAllProjectMcpServers' "$SETTINGS_FILE")
    if [ "$CURRENT" = "true" ]; then
      echo "📊 Project MCP servers: ENABLED"
    else
      echo "📊 Project MCP servers: DISABLED"
    fi
    ;;
  *)
    echo "Usage: $0 {on|off|toggle|status}"
    echo ""
    echo "Commands:"
    echo "  on, enable    - Enable project MCP servers (fetch, notion, etc.)"
    echo "  off, disable  - Disable project MCP servers"
    echo "  toggle        - Toggle current state"
    echo "  status        - Show current state"
    exit 1
    ;;
esac
