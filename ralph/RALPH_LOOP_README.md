# Ralph Loop Setup

This directory (`ralph/`) contains the files needed for a Ralph Wiggum autonomous development loop, based on [snarktank/ralph](https://github.com/snarktank/ralph).

## What is Ralph?

Ralph is an autonomous AI agent loop that runs AI coding tools repeatedly until all PRD items are complete. Each iteration is a fresh instance with clean context. Memory persists via git history, `progress.txt`, and `prd.json`.

## Files

### `ralph.sh`
The bash loop that spawns fresh AI instances using `claudeglm --dangerously-skip-permissions`. Default max iterations: 5.

### `CLAUDE.md`
The prompt template that gets fed to Claude in each iteration. Contains instructions for working through user stories, updating progress, and following TDD principles.

### `prd.json`
A structured task list in JSON format with user stories. Each story has:
- `id`: Unique identifier (e.g., "US-001")
- `title`: Story title
- `description`: What needs to be built
- `acceptanceCriteria`: List of requirements
- `priority`: Order of execution (1 = highest)
- `passes`: Boolean tracking completion status
- `notes`: Additional context

### `progress.txt`
An append-only log of learnings and progress. The "Codebase Patterns" section at the top consolidates reusable knowledge for future iterations.

## Prerequisites

- `claudeglm` command available in PATH
- `jq` installed (`brew install jq` on macOS)
- A git repository for your project

## Usage

### Run Ralph Loop

From the project root:

```bash
./ralph/ralph.sh [max_iterations]
```

Or from the `ralph/` directory:

```bash
cd ralph
./ralph.sh [max_iterations]
```

Default max iterations is 5. You can override:

```bash
./ralph/ralph.sh 10  # Run up to 10 iterations
```

### How It Works

1. **Reads PRD**: Loads `ralph/prd.json` to see all user stories
2. **Picks Next Story**: Selects highest priority story where `passes: false`
3. **Implements Story**: Works on that single story following TDD
4. **Runs Quality Checks**: Typecheck, lint, tests
5. **Commits Changes**: If checks pass, commits with message `feat: [Story ID] - [Story Title]`
6. **Updates PRD**: Sets `passes: true` for completed story
7. **Logs Progress**: Appends learnings to `progress.txt`
8. **Repeats**: Until all stories pass or max iterations reached

### Completion

When all stories have `passes: true`, Claude outputs ` COMPLETE ` and the loop exits.

## Key Concepts

### Each Iteration = Fresh Context

Each iteration spawns a **new AI instance** with clean context. The only memory between iterations is:
- Git history (commits from previous iterations)
- `progress.txt` (learnings and context)
- `prd.json` (which stories are done)

### Small Tasks

Each user story should be small enough to complete in one context window. If a task is too big, split it into multiple stories.

**Right-sized stories:**
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic
- Add a filter dropdown to a list

**Too big (split these):**
- "Build the entire dashboard"
- "Add authentication"
- "Refactor the API"

### Codebase Patterns

After each iteration, Ralph updates the "Codebase Patterns" section in `progress.txt` with learnings. This helps future iterations understand:
- Patterns discovered ("this codebase uses X for Y")
- Gotchas ("do not forget to update Z when changing W")
- Useful context ("the settings panel is in component X")

### Feedback Loops

Ralph only works if there are feedback loops:
- Typecheck catches type errors
- Tests verify behavior
- CI must stay green (broken code compounds across iterations)

### Browser Verification

Frontend stories include "Verify in browser using dev-browser skill" in acceptance criteria. Ralph will use the dev-browser skill to navigate to the page, interact with the UI, and confirm changes work.

## Debugging

Check current state:

```bash
# See which stories are done
cat ralph/prd.json | jq '.userStories[] | {id, title, passes}'

# See learnings from previous iterations
cat ralph/progress.txt

# Check git history
git log --oneline -10
```

## Customizing

### Update CLAUDE.md

Customize `ralph/CLAUDE.md` for your project:
- Add project-specific quality check commands
- Include codebase conventions
- Add common gotchas for your stack

### Update prd.json

Add or modify user stories in `ralph/prd.json`:
- Each story needs unique `id`
- Set `priority` to control execution order
- Set `passes: false` for incomplete stories
- Include specific `acceptanceCriteria`

## Archiving

Ralph automatically archives previous runs when you start a new feature (different `branchName`). Archives are saved to `ralph/archive/YYYY-MM-DD-feature-name/`.

## References

- [snarktank/ralph](https://github.com/snarktank/ralph) - Original implementation
- [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/) - Original technique
- [Claude Code documentation](https://docs.anthropic.com/claude/docs/claude-code)
