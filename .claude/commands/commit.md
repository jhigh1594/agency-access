# commit

## Purpose
Create well-structured git commits following GitHub's commit message guidelines and best practices.

## Usage
Type `/commit` in Cursor chat, then describe what changes you want to commit.

## How It Works
1. Stages files (or prompts to stage)
2. Reviews staged changes and shows diff preview
3. **Checks if documentation needs updating** ⭐
   - Prompts to review memory-bank, READMEs, CLAUDE.md, .cursor/rules
   - Allows updating docs and staging them
4. Helps craft a clear, descriptive commit message
5. Ensures atomic commits (one logical change per commit)
6. Follows GitHub commit message guidelines
7. Commits and pushes to remote

## Commit Message Format

```
Short (72 chars or less) summary

More detailed explanatory text. Wrap it to 72 characters. The blank
line separating the summary from the body is critical (unless you omit
the body entirely).

Write your commit message in the imperative: "Fix bug" and not "Fixed
bug" or "Fixes bug."

Further paragraphs come after blank lines.

- Bullet points are okay, too.
- Typically a hyphen or asterisk is used for the bullet.
```

**Subject Line:**
- 72 characters or less
- Imperative mood: "Add feature" not "Added feature" or "Adds feature"
- Capitalize first letter
- No period at end
- Should complete: "If applied, this commit will *\<your subject line here\>*"

**Body (optional):**
- Blank line separates subject from body
- Wrap at 72 characters
- Explain what and why, not how
- Use imperative mood
- Capitalize paragraphs
- Use bullet points for lists

**Issue References:**
- In body: `Fixes #123`, `Closes #123, #124`
- In subject: `[#123] Add CPU arch filter scheduler support`

## Examples

**Feature Addition:**
```
Add git commit helper script

Adds interactive script for creating well-formed commit messages
following GitHub guidelines. Includes documentation review prompts
and automatic formatting validation.
```

**Bug Fix:**
```
Fix template path resolution in PPT generator

Fixes issue where template paths weren't resolved correctly
when running from different directories. Now uses absolute paths
based on script location.

Fixes #123
```

**Documentation Update:**
```
Update memory bank with recent workflow changes

Documents the new commit command workflow and updates current
work status. Reflects changes to documentation review process.
```

**Complex Change:**
```
Add CPU arch filter scheduler support

In a mixed environment of different CPU architectures, the scheduler
needs to filter available nodes based on architecture compatibility.

- Add architecture detection to node metadata
- Filter nodes by requested architecture
- Update scheduler API to accept arch parameter
```

## Best Practices
- **Atomic commits:** One logical change per commit
- **Clear messages:** Explain what changed and why
- **Imperative mood:** "Add feature" not "Added feature" or "Adds feature"
- **Be specific:** "Fix login validation" not "Fix bug"
- **Review before committing:** Always review `git diff --staged`
- **Focus on why:** Explain why the change was made, not just what changed
