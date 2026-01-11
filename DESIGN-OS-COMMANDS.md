# Design OS Quick Access

## Option 1: NPM Script (Quick)

```bash
npm run design-os:quick
```
- Starts server (if needed)
- Opens Claude Code in Design OS directory
- Minimal output

## Option 2: NPM Script (Full)

```bash
npm run design-os
```
- Starts server
- Opens browser to Design OS
- Opens Claude Code
- Shows command reference
- Colored output with instructions

## Option 3: Direct Access

```bash
cd tools/design-os && claude
```
- Manual navigation
- Server must be running separately

## Option 4: Shell Alias (Recommended)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Design OS alias
alias dos='cd /Users/jhigh/agency-access-platform/tools/design-os && claude'
alias dos-server='cd /Users/jhigh/agency-access-platform/tools/design-os && npm run dev'
```

Then use from anywhere:
```bash
dos          # Open Claude Code in Design OS
dos-server   # Start Design OS server
```

## Option 5: Shell Function (Enhanced)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
design-os() {
    local DIR="/Users/jhigh/agency-access-platform/tools/design-os"
    cd "$DIR" || return

    # Start server if not running
    if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "🚀 Starting Design OS..."
        npm run dev > /tmp/design-os.log 2>&1 &
        sleep 2
    fi

    # Open Claude Code
    claude
}
```

Then use from anywhere:
```bash
design-os
```

---

## Design OS Slash Commands (for Claude Code)

Once in Design OS, use these commands:

**Planning:**
- `/product-vision` — Define product
- `/product-roadmap` — Create sections
- `/data-model` — Define entities
- `/design-tokens` — Colors & typography
- `/design-shell` — Navigation & layout

**Section Design:**
- `/shape-section` — Define section
- `/sample-data` — Generate data
- `/design-screen` — Create UI
- `/screenshot-design` — Capture screens

**Export:**
- `/export-product` — Generate handoff

---

## Server Management

| Command | Purpose |
|---------|---------|
| `npm run dev:design-os` | Start server only |
| `lsof -ti:5173 \| xargs kill -9` | Kill server on port 5173 |
| `lsof -ti:5174 \| xargs kill -9` | Kill server on port 5174 |

---

## Quick Start

1. **First time setup:**
   ```bash
   npm run design-os
   ```

2. **Daily use (with shell alias):**
   ```bash
   dos  # or: design-os
   ```

3. **From project root:**
   ```bash
   npm run design-os:quick
   ```
