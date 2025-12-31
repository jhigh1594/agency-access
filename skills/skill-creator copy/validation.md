# Skill Validation Guidelines

This file provides validation rules and common mistakes to check when creating or reviewing a Claude Skill.

## Required Elements

### YAML Frontmatter

Every SKILL.md file **must** start with YAML frontmatter containing:

```yaml
---
name: skill-name
description: Skill description
---
```

**Validation Checklist:**
- [ ] YAML frontmatter is present
- [ ] `name` field exists
- [ ] `description` field exists
- [ ] YAML is properly formatted (three dashes, correct indentation)
- [ ] No syntax errors in YAML

### Name Field Requirements

The `name` field must:
- Be present and non-empty
- Use kebab-case (lowercase letters, numbers, and hyphens only)
- Be descriptive but concise
- Not contain spaces or special characters (except hyphens)
- Not start or end with a hyphen

**Valid Examples:**
- `pdf-manipulation`
- `api-documentation`
- `code-reviewer`
- `data-analyzer`

**Invalid Examples:**
- `PDF Manipulation` (spaces, uppercase)
- `pdf_manipulation` (underscores)
- `pdf.manipulation` (periods)
- `-pdf-manipulation` (starts with hyphen)
- `pdf-manipulation-` (ends with hyphen)

### Description Field Requirements

The `description` field must:
- Be present and non-empty
- Be clear and specific about what the skill does
- Indicate when the skill should be triggered
- Be concise (typically 1-2 sentences)
- Not be too vague or generic

**Good Examples:**
- "Manipulates PDF files including reading, filling forms, and extracting data"
- "Provides guidance on using the project's REST API endpoints and authentication"
- "Reviews code for security vulnerabilities and suggests improvements"

**Poor Examples:**
- "Does stuff with files" (too vague)
- "Helps with things" (not specific)
- "A skill for Claude" (doesn't describe purpose)
- "This skill does many things including file manipulation, data processing, API calls, database queries, web scraping, and more" (too long, not focused)

## File Structure Validation

### Directory Structure

- [ ] Skill is in its own directory
- [ ] Directory name matches skill name (kebab-case)
- [ ] SKILL.md is in the root of the skill directory
- [ ] All referenced files exist in the skill directory

### File References

When SKILL.md references other files:

- [ ] All referenced files exist
- [ ] File paths are relative to the skill directory
- [ ] File names use appropriate extensions (.md, .py, .js, etc.)
- [ ] File names are descriptive and follow naming conventions

**Example of valid reference:**
```markdown
For detailed instructions, see `forms.md`.
```

**Example of invalid reference:**
```markdown
See `../other-skill/file.md` (references file outside skill directory)
See `forms` (missing file extension, unclear)
```

### Code Files

If the skill includes executable code:

- [ ] Code files are clearly marked as executable vs. reference
- [ ] Instructions specify when to run code vs. read it
- [ ] Code has proper error handling
- [ ] Dependencies are documented
- [ ] Code follows security best practices

## Common Mistakes

### Mistake 1: Missing or Invalid YAML Frontmatter

**Problem:**
```markdown
# My Skill

This skill does things...
```

**Solution:**
```markdown
---
name: my-skill
description: Does specific things...
---

# My Skill

This skill does things...
```

### Mistake 2: Vague Description

**Problem:**
```yaml
description: Helps with stuff
```

**Solution:**
```yaml
description: Analyzes code for security vulnerabilities and suggests fixes
```

### Mistake 3: Incorrect Name Format

**Problem:**
```yaml
name: My Awesome Skill
```

**Solution:**
```yaml
name: my-awesome-skill
```

### Mistake 4: Broken File References

**Problem:**
```markdown
See `instructions.md` for details.
```
(But instructions.md doesn't exist)

**Solution:**
- Create the referenced file, or
- Remove the reference, or
- Fix the filename if it's a typo

### Mistake 5: Too Much Content in SKILL.md

**Problem:**
SKILL.md is 5000 words with everything in one file.

**Solution:**
Split into multiple files:
- Keep core instructions in SKILL.md
- Move detailed sections to separate files
- Reference them from SKILL.md

### Mistake 6: Unclear When to Trigger

**Problem:**
```yaml
description: Does things with files
```

**Solution:**
```yaml
description: Manipulates PDF files including reading, filling forms, and extracting data
```

### Mistake 7: Missing Instructions

**Problem:**
SKILL.md has only metadata and no actual instructions for Claude.

**Solution:**
Add clear instructions on how Claude should use the skill.

### Mistake 8: Code Without Context

**Problem:**
Script included but no explanation of when/how to use it.

**Solution:**
Document:
- When to execute the script
- What parameters it needs
- What it returns
- Error handling

## Validation Checklist

Use this checklist before finalizing your skill:

### YAML Frontmatter
- [ ] YAML frontmatter present
- [ ] `name` field exists and is valid (kebab-case)
- [ ] `description` field exists and is specific
- [ ] YAML syntax is correct

### File Structure
- [ ] Skill is in its own directory
- [ ] SKILL.md exists in skill directory
- [ ] All referenced files exist
- [ ] File references use correct paths

### Content Quality
- [ ] Instructions are clear and actionable
- [ ] Description indicates when skill should trigger
- [ ] Examples are included (if helpful)
- [ ] Content is well-organized

### Code (if applicable)
- [ ] Code files are documented
- [ ] Execution vs. reference is clear
- [ ] Security considerations addressed
- [ ] Dependencies documented

### Best Practices
- [ ] Uses progressive disclosure appropriately
- [ ] Name and description are optimized for Claude's triggering
- [ ] Structure scales well
- [ ] Follows guidelines from `best-practices.md`

## Automated Validation

While there's no automated validator yet, you can manually check:

1. **YAML Syntax**: Use a YAML validator or linter
2. **File Existence**: List directory contents and verify all references
3. **Naming**: Check name follows kebab-case convention
4. **Description**: Review for clarity and specificity

## Getting Help

If validation fails:
1. Review the common mistakes above
2. Check `best-practices.md` for guidance
3. Look at examples in `templates/examples.md` and templates in `templates/` folder
4. Ask for clarification on specific validation errors

