# Real-World Skill Examples

This file provides real-world examples of Claude Skills to illustrate different structures and approaches.

## Example 1: PDF Skill (from Anthropic)

This example shows how a skill can be structured with multiple files for progressive disclosure.

### SKILL.md Structure

```markdown
---
name: pdf
description: Manipulate PDF files including reading, filling forms, and extracting data.
---

# PDF Skill

This skill enables Claude to work with PDF files.

## Core Operations

- Read and parse PDF content
- Fill PDF forms
- Extract form fields
- Extract text and data

## Form Filling

For detailed instructions on filling PDF forms, see `forms.md`.

## Reference

See `reference.md` for PDF library documentation and API details.
```

### Referenced Files

- `forms.md`: Detailed form-filling instructions
- `reference.md`: PDF library API documentation

### Key Features

- Lean SKILL.md with core overview
- Progressive disclosure: form-filling details in separate file
- Reference documentation separated from instructions
- Clear file references

## Example 2: Simple Documentation Skill

This example shows a simple skill that could fit in one file or be split if it grows.

```markdown
---
name: api-documentation
description: Provides guidance on using the project's REST API endpoints, authentication, and error handling.
---

# API Documentation Skill

## Purpose

This skill helps Claude answer questions about the project's REST API, including endpoints, authentication, request/response formats, and error codes.

## When to Use

Use this skill when users ask about:
- API endpoints and methods
- Authentication requirements
- Request/response formats
- Error codes and handling
- Rate limiting

## API Overview

The API follows RESTful conventions and uses JSON for all requests and responses.

## Authentication

All requests require an API key in the `Authorization` header:
```
Authorization: Bearer YOUR_API_KEY
```

## Common Endpoints

- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user details

For complete endpoint documentation, see `endpoints.md`.

## Error Handling

See `errors.md` for error codes and handling strategies.
```

### Notes

- Could start as a simple skill (all in one file)
- Can evolve to multi-file structure if it grows
- References additional files for detailed information
- Clear separation of concerns (endpoints vs. errors)

## Example 3: Code Review Skill

This example shows a skill that might include executable code for analysis.

```markdown
---
name: security-code-reviewer
description: Reviews code for security vulnerabilities including SQL injection, XSS, and authentication flaws.
---

# Security Code Reviewer

## Purpose

This skill helps Claude identify security vulnerabilities in code by analyzing patterns and using automated tools.

## When to Use

Use this skill when:
- Reviewing code for security issues
- Auditing codebases for vulnerabilities
- Learning about security best practices

## Available Tools

This skill includes the following analysis scripts:

- **`analyze-sql-injection.py`**: Scans code for SQL injection vulnerabilities
  - Usage: `python analyze-sql-injection.py <file-path>`
  - Parameters: File path to analyze
  - Output: JSON report of potential vulnerabilities

- **`check-authentication.py`**: Verifies authentication patterns
  - Usage: `python check-authentication.py <directory>`
  - Parameters: Directory to scan
  - Output: List of authentication issues found

## Workflow

1. Review code manually for obvious issues
2. Run appropriate analysis scripts
3. Review script output
4. Provide recommendations

## Reference

See `vulnerability-patterns.md` for common vulnerability patterns and fixes.
```

### Key Features

- Combines manual review with automated tools
- Clear documentation of executable scripts
- Separates patterns (reference) from tools (executable)
- Progressive disclosure for detailed information

## Lessons from Examples

1. **Start simple**: Begin with a single file, split when needed
2. **Progressive disclosure**: Move details to separate files
3. **Clear references**: Explicitly reference additional files
4. **Focused files**: Each file should have a clear purpose
5. **Evolve over time**: Skills can grow from simple to multi-file

## Using These Examples

When creating your skill:
- Choose the example that best matches your use case
- Adapt the structure to your needs
- Don't over-engineer: start simple
- Split files only when content grows or contexts differ

