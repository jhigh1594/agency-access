#!/bin/bash

# Launch Chrome with CDP for browser automation
# Usage: ./scripts/chrome-debug.sh

USER_DATA_DIR="${TMPDIR}/chrome-debug"
CDP_PORT=9222

echo "🚀 Launching Chrome with DevTools Protocol..."
echo "📁 User data: $USER_DATA_DIR"
echo "🔌 CDP Port: $CDP_PORT"
echo ""
echo "Connect your tools to: http://localhost:$CDP_PORT"
echo ""
echo "Press Ctrl+C to stop Chrome"

# Detect OS and launch accordingly
case "$(uname -s)" in
  Darwin)
    # macOS
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
      --remote-debugging-port="$CDP_PORT" \
      --user-data-dir="$USER_DATA_DIR"
    ;;
  Linux)
    # Linux
    google-chrome \
      --remote-debugging-port="$CDP_PORT" \
      --user-data-dir="$USER_DATA_DIR"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    # Windows (Git Bash, MSYS2, etc.)
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
      --remote-debugging-port="$CDP_PORT" \
      --user-data-dir="C:/chrome-debug"
    ;;
  *)
    echo "❌ Unsupported OS. Please launch Chrome manually with:"
    echo "chrome --remote-debugging-port=$CDP_PORT --user-data-dir=$USER_DATA_DIR"
    exit 1
    ;;
esac
