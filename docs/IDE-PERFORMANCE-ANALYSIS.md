# IDE Performance Analysis — Agency Access Platform

## Executive Summary

The project is freezing or becoming unresponsive in Cursor primarily because the IDE is indexing and watching **530+ non-source files** in skill/agent directories (`.agents/`, `.claude/`, `.codex/`) that are not ignored, plus a large monorepo with **~10,700 files** in `node_modules`. Add a `.cursorignore` and tune exclusions to fix this.

---

## Findings

### 1. Skill/Agent Directories (High Impact)

| Directory  | File Count | Size   | In .gitignore? |
|-----------|------------|--------|-----------------|
| `.agents/` | ~325      | 600KB  | No              |
| `.claude/` | ~203      | 1.6MB  | No              |
| `.codex/`  | ~100+     | 544KB  | No              |
| `.aipmos/` | 1 (events.db) | 148KB | No      |

**Impact:** ~530+ markdown/skill/config files are indexed, watched, and searched. They are rarely needed for daily coding. Indexing and file watching on this many files is a major source of IDE slowdown.

### 2. node_modules (High Impact)

| Location                  | Size  | Approx. Files |
|--------------------------|-------|---------------|
| Root `node_modules/`      | 1.4GB | ~10,700       |
| `apps/web/node_modules/` | 20MB  | (symlinks)     |
| `apps/api/node_modules/` | 2.4MB | (symlinks)    |
| `tools/design-os/node_modules/` | (present) | —    |

**Impact:** `node_modules` is listed in `.gitignore`, and Cursor usually honors that. Still, any accidental indexing or watching of these directories will severely hurt performance.

### 3. Monorepo Layout

- **Workspaces:** `apps/web`, `apps/api`, `apps/docs`, `packages/shared`, `tools/design-os`
- **TypeScript:** Multiple `tsconfig.json` files; `skipLibCheck: true` is set (good)
- **ESLint:** Separate configs per app, with ignores for `.next`, `node_modules`, tests

**Impact:** Multi-package setup increases TSServer load. It’s manageable, but it adds work.

### 4. What’s Already Ignored

`.gitignore` correctly excludes:

- `node_modules`, `.next`, `dist`, `build`, `*.tsbuildinfo`
- `.env*.local`, coverage, `.specstory/`, `.firecrawl/`
- `scripts/perf/results/`, `scripts/perf/traces/`

**Gap:** `.agents`, `.claude`, `.codex`, `.aipmos` are **not** in `.gitignore`.

### 5. Missing .cursorignore

There is no `.cursorignore`. Cursor falls back to `.gitignore` for indexing. Because the skill dirs aren’t gitignored, they are fully indexed and watched.

---

## Recommended Actions

### Priority 1: Add .cursorignore (Critical)

Create `.cursorignore` in the project root to exclude:

- All skill/agent directories
- Build outputs
- `node_modules` (extra safety)
- Any other large/generated folders

This should noticeably improve responsiveness and indexing time.

### Priority 2: Optionally Add Skill Dirs to .gitignore

If these skill/agent files are not needed in version control, add them to `.gitignore` to reduce:

- `git status` work
- General git overhead in the IDE

### Priority 3: VSCode/Cursor `files.watcherExclude`

If available in Cursor, add `files.watcherExclude` settings to stop watching heavy or unnecessary directories.

---

## What Not to Change

- **tsconfig `exclude`:** Excludes `node_modules` and tests; no change needed.
- **ESLint `ignores`:** Already excludes `.next`, `node_modules`, tests.
- **`skipLibCheck: true`:** Keeps type checking of libraries off; leave enabled.
- **Monorepo structure:** Don’t restructure for performance unless other issues justify it.

---

## Verification

After adding `.cursorignore`:

1. Run **“Reindex Codebase”** from the Command Palette (Cmd+Shift+P).
2. Restart Cursor.
3. Monitor startup time and responsiveness during normal use.

Expected result: faster startup, fewer freezes, and lower CPU when idle.
