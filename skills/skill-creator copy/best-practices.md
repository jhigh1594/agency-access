# Best Practices for Creating Claude Skills

This guide provides best practices for creating effective Claude Skills, based on Anthropic's recommendations and proven patterns.

## Core Principles

### 1. Start with Evaluation

**Before building a skill, identify specific gaps in Claude's capabilities.**

- Run Claude on representative tasks
- Observe where it struggles or requires additional context
- Build skills incrementally to address these shortcomings
- Don't build skills for capabilities Claude already has

**Example:**
Instead of building a general "coding" skill, identify that Claude struggles with your specific codebase's patterns. Build a skill that captures those patterns.

### 2. Structure for Scale

**Design your skill to grow without becoming unwieldy.**

- When SKILL.md exceeds ~2000 words, split content into separate files
- If certain contexts are mutually exclusive or rarely used together, keep them in separate files
- Use progressive disclosure to reduce token usage
- Code can serve as both executable tools and documentation - make it clear which is which

**Example:**
A skill for API documentation might have:
- `SKILL.md`: Core overview and when to use
- `authentication.md`: Auth details (only needed for auth questions)
- `endpoints.md`: Endpoint reference (only needed for endpoint questions)
- `errors.md`: Error handling (only needed for error questions)

### 3. Think from Claude's Perspective

**Design your skill so Claude can effectively discover and use it.**

- Monitor how Claude uses your skill in real scenarios
- Iterate based on observations
- Pay special attention to `name` and `description` - Claude uses these to decide when to trigger the skill
- Watch for unexpected trajectories or overreliance on certain contexts

**Good Name/Description:**
```yaml
name: pdf-form-filler
description: Fills out PDF forms by extracting field names and populating them with provided data
```

**Poor Name/Description:**
```yaml
name: pdf
description: PDF stuff
```

### 4. Iterate with Claude

**Use Claude to help improve your skills.**

- As you work on tasks with Claude, ask it to capture successful approaches into reusable context
- When Claude goes off track using a skill, ask it to self-reflect on what went wrong
- This process helps discover what context Claude actually needs, rather than trying to anticipate it upfront
- Let Claude help you refine the skill based on real usage

## Progressive Disclosure Patterns

### Level 1: Metadata (Always Loaded)

The YAML frontmatter is loaded into Claude's system prompt at startup. This is your first chance to help Claude decide when to use the skill.

**Best Practices:**
- Make the description specific enough that Claude knows when to trigger it
- Include key trigger words in the description
- Keep it concise (1-2 sentences typically)

### Level 2: SKILL.md Body (Loaded When Triggered)

The main SKILL.md content is loaded when Claude decides the skill is relevant.

**Best Practices:**
- Start with a clear purpose statement
- Provide actionable instructions
- Include examples when helpful
- Reference additional files for detailed information
- Keep core content focused and lean

### Level 3+: Referenced Files (Loaded As Needed)

Additional files are loaded only when Claude needs them.

**Best Practices:**
- Split content by topic or use case
- Keep files focused on specific scenarios
- Use clear, descriptive filenames
- Reference files explicitly in SKILL.md
- Don't create files that are always needed together (merge them instead)

## When to Split into Multiple Files

Split your skill into multiple files when:

1. **SKILL.md exceeds ~2000 words**
   - Harder for Claude to navigate
   - Wastes tokens loading unused content

2. **Contexts are mutually exclusive**
   - Different use cases that rarely overlap
   - Example: "filling forms" vs "extracting data" from PDFs

3. **Content is rarely used together**
   - Reference material that's only needed occasionally
   - Example: API endpoint details vs error handling

4. **Different audiences or scenarios**
   - Beginner vs advanced instructions
   - Different workflow paths

**Don't split when:**
- Content is always needed together
- Files would be tiny (< 200 words)
- Splitting adds complexity without benefit

## Code Execution Considerations

### When to Include Code

Include executable code when:
- Operations are better suited for traditional code (sorting, parsing, calculations)
- You need deterministic reliability
- Token generation would be inefficient
- Operations are complex or error-prone

### Code as Tool vs Documentation

**Code as Tool (Executable):**
- Scripts Claude should run
- Clearly document when and how to execute
- Include parameter descriptions
- Document expected outputs
- Include error handling

**Code as Documentation (Reference):**
- Examples to illustrate concepts
- Reference implementations
- Clearly mark as "reference only" or "example code"

**Example:**
```markdown
## Available Scripts

### `extract-form-fields.py` (Executable)
Run this script to extract all form fields from a PDF:
```bash
python extract-form-fields.py path/to/file.pdf
```

Returns JSON with field names and types.

### Example Implementation (Reference Only)
See `example-implementation.py` for a reference implementation of the extraction algorithm.
```

## Security Considerations

Skills provide Claude with new capabilities through instructions and code. This power requires security awareness.

### Trust and Audit

- **Only install skills from trusted sources**
- When installing from less-trusted sources, thoroughly audit before use
- Read all files in the skill to understand what it does
- Pay attention to code dependencies
- Check bundled resources (images, scripts)
- Review instructions that connect to external network sources

### Code Security

- Review all executable code
- Check for network calls to untrusted sources
- Verify file operations are safe
- Ensure no data exfiltration
- Check for unintended side effects

### Instruction Security

- Review instructions for potentially harmful actions
- Check for instructions to access sensitive data
- Verify instructions don't bypass security controls
- Ensure instructions follow security best practices

## Evaluation and Iteration Strategies

### Initial Evaluation

1. **Identify gaps**: Run Claude on representative tasks
2. **Observe failures**: Note where Claude struggles
3. **Categorize issues**: Group similar problems
4. **Prioritize**: Address most impactful gaps first

### Building Incrementally

1. **Start small**: Create a minimal skill that addresses one gap
2. **Test**: Use the skill on real tasks
3. **Observe**: Watch how Claude uses it
4. **Iterate**: Refine based on observations
5. **Expand**: Add more capabilities as needed

### Monitoring Usage

Watch for:
- **Over-triggering**: Skill activates when it shouldn't
- **Under-triggering**: Skill doesn't activate when it should
- **Inefficient usage**: Claude loads too much context
- **Missing context**: Claude needs information not in skill
- **Confusion**: Claude misunderstands instructions

### Refinement Process

1. **Collect feedback**: Note issues during real usage
2. **Analyze patterns**: Identify common problems
3. **Update skill**: Fix issues in skill files
4. **Test again**: Verify improvements
5. **Repeat**: Continue iterating

## Naming and Description Optimization

### Name Best Practices

- Use kebab-case: `pdf-form-filler` not `PDF Form Filler`
- Be descriptive: `api-authentication` not `auth`
- Be specific: `rest-api-docs` not `api-docs` (if you also have GraphQL)
- Keep it concise: `code-reviewer` not `automated-code-review-and-analysis-tool`

### Description Best Practices

- **Be specific**: "Fills PDF forms" not "Works with PDFs"
- **Include trigger words**: "API authentication" not "Authentication"
- **Indicate scope**: "Project's REST API" not "APIs"
- **Mention key capabilities**: "Fills forms, extracts data" not "PDF operations"
- **Keep it concise**: 1-2 sentences, under 200 characters ideally

**Good Examples:**
```yaml
name: pdf-form-filler
description: Fills out PDF forms by extracting field names and populating them with provided data

name: rest-api-docs
description: Provides documentation for the project's REST API endpoints, authentication, and error codes

name: security-code-reviewer
description: Reviews code for security vulnerabilities including SQL injection, XSS, and authentication flaws
```

## Content Organization

### Structure Your Content

1. **Start with purpose**: What does this skill enable?
2. **Define scope**: When should it be used?
3. **Provide instructions**: How should Claude use it?
4. **Include examples**: Show real usage
5. **Add reference**: Link to detailed docs

### Writing Clear Instructions

- Use active voice: "Extract the form fields" not "Form fields should be extracted"
- Be specific: "Use the `fill_form()` function" not "Fill the form"
- Provide context: "When the user provides form data" not "Fill forms"
- Include examples: Show actual usage
- Anticipate questions: Address common scenarios

## Testing Your Skill

### Test Scenarios

1. **Trigger accuracy**: Does Claude activate it at the right times?
2. **Instruction clarity**: Does Claude follow instructions correctly?
3. **Context loading**: Does Claude load appropriate files?
4. **Edge cases**: How does it handle unusual inputs?
5. **Error handling**: What happens when things go wrong?

### Iteration Based on Testing

- If skill doesn't trigger: Improve name/description
- If instructions unclear: Refine instructions, add examples
- If too much context loaded: Split into more files
- If missing context: Add referenced files
- If errors occur: Improve error handling, add validation

## Summary

The key to effective skills is:
1. **Start with evaluation** - Build to address real gaps
2. **Structure for scale** - Use progressive disclosure
3. **Think from Claude's perspective** - Optimize name/description
4. **Iterate with Claude** - Let real usage guide improvements

Remember: Skills are simple but powerful. Start simple, test with real usage, and iterate based on what you learn.

