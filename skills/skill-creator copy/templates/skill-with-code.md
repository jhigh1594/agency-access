# Skill with Code Execution Template

Use this template when your skill includes executable scripts that Claude should run.

## When to Use This Template

- Requires deterministic operations
- Needs to execute scripts (sorting, parsing, calculations)
- Code serves as both tool and documentation
- Operations are better suited for traditional code than token generation

## Template

```markdown
---
name: your-skill-name
description: A clear, specific description of what the skill does and when it should be used.
---

# Skill Name

## Purpose

[Describe what this skill enables Claude to do]

## When to Use This Skill

[Describe when Claude should trigger this skill]

## Instructions

[Provide instructions for Claude on when and how to use the included scripts]

## Available Scripts

This skill includes the following executable scripts:

- **`script-name.py`**: [Description of what the script does]
  - Usage: [How Claude should invoke it]
  - Parameters: [What parameters it accepts]
  - Output: [What it returns]

## Code Execution Guidelines

- [Guidelines for when to run scripts vs. when to read them as reference]
- [Any prerequisites or setup requirements]
- [Error handling considerations]

## Examples

[Examples of using the scripts]

## Reference

For detailed API documentation or specifications, see `reference.md`.
```

## Code Organization

When using this template, include executable scripts in the skill directory:

- `script-name.py`: Executable script that Claude should run
- `reference.md`: Optional reference documentation

**Important**: Clearly distinguish between:
- **Executable code**: Scripts Claude should run
- **Reference code**: Examples or documentation Claude should read

## Code Execution Best Practices

1. **Document clearly**: Specify when to run scripts vs. read them
2. **Parameter documentation**: Clearly document what parameters scripts accept
3. **Output format**: Describe what scripts return
4. **Error handling**: Include error handling in scripts and document expected errors
5. **Prerequisites**: Document any dependencies or setup requirements
6. **Security**: Review code for security implications (see `best-practices.md`)

## Customization Tips

1. **Name**: Use kebab-case, be descriptive but concise
2. **Description**: Be specific about when the skill should trigger
3. **Scripts**: Clearly mark executable vs. reference code
4. **Documentation**: Document when and how to use each script
5. **Examples**: Include examples of script usage

## Next Steps

After using this template:
1. Fill in the YAML frontmatter
2. Create the executable scripts
3. Document script usage and parameters
4. Validate using `validation.md`
5. Review security considerations in `best-practices.md`

