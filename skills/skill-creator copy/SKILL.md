---
name: skill-creator
description: Guides users through creating Claude Skills, generates skill files from specifications, and provides templates, validation, and best practices.
---

# Skill Creator

This skill helps you create Claude Skills by providing interactive guidance, generating complete skill files, and offering templates, validation, and best practices.

## When to Use This Skill

Use this skill when you want to:
- Create a new Claude Skill from scratch
- Get guidance on structuring a skill
- Validate an existing skill's structure
- Learn best practices for skill development
- Generate skill files from specifications

## How This Skill Works

This skill operates in two modes:

1. **Interactive Guidance Mode**: Ask questions to understand your skill's purpose, scope, and requirements, then guide you through creation step-by-step. See `workflow.md` for the detailed process.

2. **File Generation Mode**: Generate complete skill directories with proper structure based on your specifications. Use templates from the `templates/` folder as starting points.

## Core Concepts

### Skill Structure

A Claude Skill is a directory containing:
- **SKILL.md** (required): The main skill file with YAML frontmatter and instructions
- **Additional files** (optional): Referenced files for progressive disclosure, code scripts, or reference materials

### Progressive Disclosure

Skills use progressive disclosure to manage context efficiently:
- **Level 1**: YAML frontmatter (name, description) - loaded at startup
- **Level 2**: SKILL.md body - loaded when skill is triggered
- **Level 3+**: Additional referenced files - loaded only when needed

### Required YAML Frontmatter

Every SKILL.md must start with:
```yaml
---
name: your-skill-name
description: A clear, specific description of what the skill does
---
```

The `name` should be kebab-case and descriptive. The `description` should be specific enough for Claude to know when to trigger the skill, but concise enough to fit in the system prompt.

## Creating a Skill

### Step 1: Define Purpose
Identify the specific task or domain expertise your skill will address. What gap in Claude's capabilities are you filling?

### Step 2: Choose Structure
Decide on your skill's structure:
- **Simple**: Just SKILL.md (for straightforward skills)
- **Multi-file**: SKILL.md + referenced files (when content exceeds ~2000 words or has distinct sections)
- **With Code**: Includes executable scripts (when deterministic operations are needed)

See `templates/selection-guide.md` to choose the right template, and `templates/` for available templates.

### Step 3: Write SKILL.md
1. Start with YAML frontmatter (name and description)
2. Write clear instructions for Claude
3. Reference additional files if needed (e.g., "See `reference.md` for detailed API documentation")

### Step 4: Add Additional Files (if needed)
- Create referenced files in the same directory
- Use clear, descriptive filenames
- Keep files focused on specific topics

### Step 5: Validate
Check your skill against the validation rules in `validation.md`:
- Required fields present
- Proper naming conventions
- File references exist
- Code files properly marked

### Step 6: Test and Iterate
Test your skill with representative tasks. Observe how Claude uses it and iterate based on:
- Whether Claude triggers it at the right times
- Whether the instructions are clear
- Whether additional context is needed

## Best Practices

Follow the guidelines in `best-practices.md` for:
- Progressive disclosure patterns
- When to split into multiple files
- Code execution considerations
- Security considerations
- Evaluation and iteration strategies

## Getting Help

- **Templates**: See `templates/` folder for ready-to-use skill templates:
  - `templates/simple-skill.md` - For single-file skills
  - `templates/multi-file-skill.md` - For skills with multiple files
  - `templates/skill-with-code.md` - For skills with executable code
  - `templates/examples.md` - Real-world skill examples
  - `templates/selection-guide.md` - Guide to choosing the right template
- **Validation**: See `validation.md` for validation rules and common mistakes
- **Best Practices**: See `best-practices.md` for development guidelines
- **Workflow**: See `workflow.md` for step-by-step interactive guidance

## Example Usage

When a user wants to create a skill, you should:

1. Ask about the skill's purpose and scope
2. Help choose an appropriate template from `templates/selection-guide.md`, then use the specific template file
3. Guide through writing the SKILL.md file
4. Validate the structure using `validation.md`
5. Provide best practices from `best-practices.md`
6. Help test and iterate on the skill

Remember: Start with evaluation to identify gaps, structure for scale, think from Claude's perspective, and iterate with Claude to capture successful patterns.

