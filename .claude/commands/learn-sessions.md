# Session Learning - Extract patterns from Claude Code sessions

You are running the **Daily Session Learning Automation** which analyzes `.specstory/history/` to extract recurring patterns and generate knowledge assets.

## What This Does

Analyzes recent Claude Code sessions to detect:
- **Repeated user requests** - Same intent phrasing across sessions
- **Successful tool sequences** - Common workflows that work
- **Problem/solution pairs** - Recurring issues and their fixes
- **File operation patterns** - Groups of files edited together

## Outputs

Based on detected patterns, generates:

1. **Skill Drafts** (in `.drafts/` for review)
   - Auto-generated skills from repeated patterns
   - Requires manual review before publishing to `.claude/skills/`

2. **AGENTS.md Updates** (direct, high-confidence patterns only)
   - "Learned Patterns" section with recent discoveries
   - Skills to consider based on workflow patterns

3. **Memory Bank Updates**
   - `memory-bank/daily-learning-summary.md` - Today's analysis results
   - `memory-bank/learned-patterns.md` - Patterns for session-start context

## Usage

```bash
# Run with default settings (last 7 days of sessions)
/learn-sessions

# Run with verbose output
/learn-sessions --verbose

# Dry run (analyze but don't write files)
/learn-sessions --dry-run

# Analyze different lookback period
/learn-sessions --days 14
```

## Configuration

Edit `scripts/automation/session_learning/config.yaml` to adjust:

- `session_analysis.lookback_days` - How many days of sessions to analyze
- `session_analysis.min_occurrences` - Minimum times pattern must appear
- `skill_generation.min_confidence` - Threshold for suggesting skills
- `agents_md_updates.auto_update` - Whether to update AGENTS.md directly

## Integration

Results are automatically loaded by `session-start.sh`:
- Learned patterns are injected into new sessions
- Skills suggested based on your workflow patterns

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║     Daily Session Learning Automation                     ║
║     Analyzing .specstory/history/ for patterns            ║
╚════════════════════════════════════════════════════════════╝

============================================================
Phase 1: Extracting patterns from sessions
============================================================
Found 47 session files to analyze
Successfully parsed 47 sessions
Detected 12 significant patterns from 45 total patterns

============================================================
Phase 2: Synthesizing knowledge updates
============================================================
Generated 3 skill drafts
Generated 8 AGENTS.md updates

============================================================
Phase 3: Writing outputs
============================================================

╔════════════════════════════════════════════════════════════╗
║     DAILY LEARNING SUMMARY                                  ║
╠════════════════════════════════════════════════════════════╣
║ ✓ Patterns detected: 45                                     ║
║ ✓ Significant patterns: 12                                  ║
║ ✓ Skills drafted: 3                                         ║
║ ✓ AGENTS.md updates: 8                                      ║
║ ✓ Confidence score: 72%                                     ║
║ ✓ Execution time: 3.2s                                      ║
╚════════════════════════════════════════════════════════════╝
```

## Reviewing Skill Drafts

Skill drafts are created in `scripts/automation/session_learning/.drafts/[skill-name]/`:

1. Review `SKILL.md` for accuracy
2. Check `metadata.yaml` for confidence and source sessions
3. If good, copy to `.claude/skills/[skill-name]/SKILL.md`
4. If not, delete the draft

## Manual Trigger

You can also run the automation directly:

```bash
cd "/Users/jhigh/Planview Work"
python3 -m scripts.automation.session_learning.daily_learning
```

---

**Ready to analyze your recent sessions for patterns?**

Run `/learn-sessions` now, or specify options like `--dry-run` to preview without changes.
