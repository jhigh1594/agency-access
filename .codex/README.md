# Codex skills

Skills in this project are under `skills/`. Codex discovers them by scanning for `SKILL.md` in each directory.

## Superpowers (copied in-repo)

The following workflow skills were copied from [Superpowers](https://github.com/obra/superpowers) (v3.2.3) so Codex in this project can use them without an external plugin:

| Skill | When to use |
|-------|-------------|
| **using-superpowers** | Start of conversation — find and use skills before responding |
| **brainstorming** | Before writing code — refine ideas, explore alternatives, validate design |
| **writing-plans** | After design is approved — detailed implementation plan for execution |
| **executing-plans** | When you have a plan — run it in batches with review checkpoints |
| **subagent-driven-development** | Implementation with independent tasks — parallel subagent execution |
| **dispatching-parallel-agents** | Multiple independent tasks — dispatch without shared state |
| **test-driven-development** | Before implementation — red/green/refactor, tests first |
| **systematic-debugging** | Any bug or test failure — reproduce, isolate, fix with evidence |
| **requesting-code-review** | Before merge — run review and address feedback |
| **receiving-code-review** | When handling review comments — verify and implement carefully |
| **verification-before-completion** | Before claiming done — run checks and confirm output |
| **finishing-a-development-branch** | Implementation complete — decide merge, PR, or cleanup |
| **using-git-worktrees** | Isolated feature work — worktrees for parallel branches |
| **writing-skills** | Creating or editing skills — structure, validation, deployment |

Source: `~/.claude/plugins/cache/superpowers-marketplace/superpowers/3.2.3/skills/` (copied into `.codex/skills/`).
