# Multi-File Skill Template

Use this template when your skill needs additional files for progressive disclosure. The SKILL.md should be lean, with detailed information in referenced files.

## When to Use This Template

- Multiple related topics
- Instructions exceed ~2000 words
- Different contexts rarely used together
- Benefits from progressive disclosure

## Template

```markdown
---
name: your-skill-name
description: A clear, specific description of what the skill does and when it should be used.
---

# Skill Name

## Purpose

[Brief description of the skill's purpose]

## When to Use This Skill

[Describe when Claude should trigger this skill]

## Quick Start

[Provide a brief overview. For detailed instructions, see the referenced files below.]

## Reference Files

- **`detailed-instructions.md`**: Complete step-by-step instructions
- **`examples.md`**: Examples and use cases
- **`reference.md`**: API documentation, specifications, or reference materials

## Basic Workflow

1. [Step 1]
2. [Step 2]
3. [Step 3]

For more details, refer to the appropriate file above.
```

## File Organization

When using this template, create additional files in the same directory:

- `detailed-instructions.md`: Step-by-step instructions for the main workflow
- `examples.md`: Real-world examples and use cases
- `reference.md`: API documentation, specifications, or reference materials

You can customize these filenames based on your skill's needs. The key is to split content by topic or use case, keeping files focused.

## Customization Tips

1. **Name**: Use kebab-case, be descriptive but concise
2. **Description**: Be specific about when the skill should trigger
3. **Structure**: Split files by topic or scenario, not arbitrarily
4. **References**: Only reference files that exist and are needed
5. **Progressive Disclosure**: Keep SKILL.md lean, move details to referenced files

## Next Steps

After using this template:
1. Fill in the YAML frontmatter
2. Customize the SKILL.md content
3. Create the referenced files with detailed information
4. Validate using `validation.md`
5. Review best practices in `best-practices.md`

