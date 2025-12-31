# Template Selection Guide

Use this guide to choose the right template for your Claude Skill.

## Decision Tree

### Step 1: Assess Complexity

**Question**: Will your skill fit in one file? (< 2000 words, single topic)

- **Yes** → Consider Simple Skill template
- **No** → Continue to Step 2

### Step 2: Assess Structure Needs

**Question**: Are there distinct topics that are rarely used together?

- **Yes** → Consider Multi-File Skill template
- **No** → Continue to Step 3

### Step 3: Assess Code Needs

**Question**: Does your skill need executable scripts?

- **Yes** → Use Skill with Code template
- **No** → Use Simple Skill or Multi-File Skill template

## Template Comparison

### Simple Skill Template

**Best for:**
- Single, focused purpose
- Instructions fit in one file (< 2000 words)
- No code execution needed
- All content typically needed together

**Example use cases:**
- API documentation (small API)
- Simple workflow guidance
- Single-purpose utilities
- Basic reference materials

**File structure:**
```
your-skill/
└── SKILL.md
```

### Multi-File Skill Template

**Best for:**
- Multiple related topics
- Instructions exceed ~2000 words
- Different contexts rarely used together
- Benefits from progressive disclosure

**Example use cases:**
- Complex API documentation (many endpoints)
- Multi-domain expertise
- Different user scenarios
- Large reference materials

**File structure:**
```
your-skill/
├── SKILL.md
├── topic-a.md
├── topic-b.md
└── reference.md
```

### Skill with Code Template

**Best for:**
- Requires deterministic operations
- Needs to execute scripts (sorting, parsing, calculations)
- Code serves as both tool and documentation
- Operations better suited for code than token generation

**Example use cases:**
- Data processing and analysis
- File manipulation
- Automated testing
- Code generation tools

**File structure:**
```
your-skill/
├── SKILL.md
├── script-name.py
└── reference.md
```

## Quick Reference

| Template | File Count | Code Execution | Best For |
|----------|------------|----------------|----------|
| Simple Skill | 1 | No | Single-purpose, < 2000 words |
| Multi-File Skill | 2+ | No | Multiple topics, > 2000 words |
| Skill with Code | 1+ | Yes | Deterministic operations needed |

## Customization Tips

Regardless of which template you choose:

1. **Name**: Use kebab-case, be descriptive but concise
2. **Description**: Be specific about when the skill should trigger
3. **Structure**: Start simple, split files only when needed
4. **Examples**: Include real examples to clarify usage
5. **References**: Link to external docs when appropriate

## Migration Path

Skills can evolve from one structure to another:

- **Simple → Multi-File**: When content grows beyond ~2000 words
- **Simple → With Code**: When you need deterministic operations
- **Any → Multi-File**: When contexts become mutually exclusive

Don't over-engineer: start with the simplest structure that works, then evolve as needed.

## Next Steps

After selecting a template:

1. Use the template file to create your SKILL.md
2. Fill in the YAML frontmatter
3. Customize the content for your specific use case
4. Add referenced files if using multi-file structure
5. Add scripts if using code template
6. Validate using `validation.md`
7. Review best practices in `best-practices.md`

## Getting Help

- See `examples.md` for real-world examples
- Review `best-practices.md` for development guidelines
- Check `workflow.md` for step-by-step creation process

