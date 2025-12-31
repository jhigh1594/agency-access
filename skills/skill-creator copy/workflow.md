# Step-by-Step Skill Creation Workflow

This guide provides an interactive workflow for creating Claude Skills. Follow these steps, and ask questions at each stage to ensure you create an effective skill.

## Phase 1: Discovery and Planning

### Step 1: Identify the Need

**Questions to ask:**
- What specific task or capability is missing?
- Where does Claude currently struggle with this domain?
- What would make Claude more effective at this task?

**Action:** Document the gap you're trying to fill.

**Example:**
- Gap: Claude doesn't understand our project's specific API patterns
- Need: Skill that provides API documentation and usage patterns

### Step 2: Define Scope

**Questions to ask:**
- What exactly should this skill cover?
- What should it NOT cover?
- What are the boundaries of this skill?

**Action:** Write a clear scope statement.

**Example:**
- Scope: REST API endpoints, authentication, error codes
- Out of scope: GraphQL API, database schemas, frontend code

### Step 3: Evaluate Current Capabilities

**Questions to ask:**
- What can Claude already do in this domain?
- What specific knowledge is missing?
- What procedural knowledge is needed?

**Action:** Test Claude on representative tasks and note gaps.

**Example:**
- Claude can: Understand REST APIs in general
- Claude cannot: Know our specific endpoints and auth flow
- Need: Project-specific API documentation

## Phase 2: Design

### Step 4: Choose Structure

**Decision tree:**

1. **Will the skill fit in one file?** (< 2000 words, single topic)
   - Yes → Use Simple Skill template
   - No → Continue to question 2

2. **Are there distinct, rarely-used-together topics?**
   - Yes → Use Multi-File Skill template
   - No → Continue to question 3

3. **Does the skill need executable code?**
   - Yes → Use Skill with Code template
   - No → Use Simple or Multi-File template

**Action:** Use `templates/selection-guide.md` to choose the right template, then use the specific template file from `templates/`.

### Step 5: Design Progressive Disclosure

**If using multi-file structure:**

**Questions to ask:**
- What are the main topics or use cases?
- Which topics are used together vs. separately?
- What information is always needed vs. occasionally needed?

**Action:** Plan file structure:
- SKILL.md: Core overview
- File 1: Topic A (used separately)
- File 2: Topic B (used separately)
- File 3: Reference material (rarely needed)

**Example:**
- SKILL.md: API overview
- authentication.md: Auth details (only for auth questions)
- endpoints.md: Endpoint reference (only for endpoint questions)
- errors.md: Error codes (only for error questions)

### Step 6: Plan Name and Description

**Questions to ask:**
- What keywords would trigger this skill?
- What's the most concise way to describe it?
- What makes it distinct from similar skills?

**Action:** Draft name and description:
- Name: kebab-case, descriptive, specific
- Description: 1-2 sentences, includes trigger words, indicates scope

**Example:**
- Name: `project-rest-api`
- Description: "Provides documentation for the project's REST API endpoints, authentication flow, and error handling"

## Phase 3: Creation

### Step 7: Create Directory Structure

**Action:**
1. Create directory: `skills/your-skill-name/`
2. Ensure directory name matches skill name (kebab-case)

**Example:**
```bash
mkdir -p skills/project-rest-api
```

### Step 8: Write YAML Frontmatter

**Action:** Create SKILL.md with YAML frontmatter:

```yaml
---
name: your-skill-name
description: Your clear, specific description
---
```

**Validation:**
- [ ] Name is kebab-case
- [ ] Description is specific and includes trigger words
- [ ] YAML syntax is correct

### Step 9: Write Core Instructions

**Questions to guide content:**
- What should Claude do when this skill is triggered?
- What information does Claude need to perform the task?
- What are the key steps or considerations?
- What examples would help clarify usage?

**Action:** Write the main content of SKILL.md:
1. Purpose statement
2. When to use the skill
3. Core instructions
4. Examples (if helpful)
5. References to additional files (if using multi-file)

**Tips:**
- Be specific and actionable
- Use active voice
- Include examples
- Reference additional files explicitly

### Step 10: Create Additional Files (if needed)

**For each additional file:**

**Questions:**
- What specific topic does this file cover?
- When would Claude need this information?
- Is this information always needed with the main content?

**Action:**
1. Create the file in the skill directory
2. Write focused content for that topic
3. Ensure SKILL.md references it clearly

**Example:**
```markdown
## Authentication

For detailed authentication instructions, see `authentication.md`.
```

## Phase 4: Validation

### Step 11: Validate Structure

**Checklist from `validation.md`:**

**YAML Frontmatter:**
- [ ] YAML frontmatter present
- [ ] `name` field exists and is valid (kebab-case)
- [ ] `description` field exists and is specific
- [ ] YAML syntax is correct

**File Structure:**
- [ ] Skill is in its own directory
- [ ] SKILL.md exists
- [ ] All referenced files exist
- [ ] File references use correct paths

**Content Quality:**
- [ ] Instructions are clear
- [ ] Description indicates when to trigger
- [ ] Examples included (if helpful)
- [ ] Content is well-organized

### Step 12: Review Best Practices

**Check against `best-practices.md`:**

- [ ] Uses progressive disclosure appropriately
- [ ] Name and description optimized for triggering
- [ ] Structure scales well
- [ ] Security considerations addressed (if applicable)
- [ ] Code properly documented (if applicable)

### Step 13: Fix Issues

**Action:** Address any validation failures or best practice violations.

## Phase 5: Testing and Iteration

### Step 14: Test with Representative Tasks

**Action:**
1. Use the skill with Claude on real tasks
2. Observe how Claude uses it
3. Note any issues:
   - Doesn't trigger when it should
   - Triggers when it shouldn't
   - Instructions unclear
   - Missing information
   - Loads too much context

### Step 15: Iterate Based on Observations

**Common issues and fixes:**

**Issue: Skill doesn't trigger**
- Fix: Improve name/description with better trigger words
- Example: "API docs" → "REST API endpoints and authentication"

**Issue: Skill triggers too often**
- Fix: Make description more specific
- Example: "API documentation" → "Project's REST API endpoints and error codes"

**Issue: Instructions unclear**
- Fix: Add examples, be more specific, clarify steps
- Example: "Fill the form" → "Use the `fill_form()` function with the provided data dictionary"

**Issue: Missing context**
- Fix: Add referenced files or expand instructions
- Example: Add `error-handling.md` for error scenarios

**Issue: Too much context loaded**
- Fix: Split into more files, use progressive disclosure
- Example: Move detailed API reference to separate file

### Step 16: Refine with Claude

**Action:**
1. Ask Claude to use the skill on a task
2. If it goes off track, ask Claude to reflect on what went wrong
3. Update the skill based on Claude's feedback
4. Repeat until the skill works well

**Example prompts:**
- "Use the skill to answer this question. If you go off track, tell me what information was missing or unclear."
- "What would make this skill more useful for this type of task?"
- "What context did you need that wasn't in the skill?"

## Phase 6: Documentation and Sharing

### Step 17: Document Usage

**Action:** Ensure the skill includes:
- Clear examples of when to use it
- Expected outputs or behaviors
- Any prerequisites or setup requirements

### Step 18: Share (Optional)

**If sharing the skill:**
- Ensure it's well-documented
- Include setup instructions if needed
- Note any dependencies or requirements
- Consider security implications

## Quick Reference: Decision Points

### Choosing a Template

```
Simple Skill:
  - Single topic
  - < 2000 words
  - No code execution
  → Use Simple Skill template

Multi-File Skill:
  - Multiple topics
  - > 2000 words OR distinct topics
  - Topics used separately
  → Use Multi-File Skill template

Skill with Code:
  - Needs executable scripts
  - Deterministic operations required
  → Use Skill with Code template
```

### When to Split Files

```
Split when:
  - SKILL.md > ~2000 words
  - Contexts are mutually exclusive
  - Content rarely used together
  - Different scenarios/audiences

Don't split when:
  - Content always needed together
  - Files would be tiny
  - Splitting adds complexity
```

### Name and Description

```
Name:
  - kebab-case
  - Descriptive but concise
  - Specific (not generic)

Description:
  - 1-2 sentences
  - Includes trigger words
  - Indicates scope
  - Under 200 characters ideally
```

## Getting Help

At any step, refer to:
- **Templates**: `templates/` folder for structure examples and templates
- **Validation**: `validation.md` for validation rules
- **Best Practices**: `best-practices.md` for guidelines
- **SKILL.md**: Main skill file for overview

## Summary

The workflow:
1. **Discover**: Identify need and scope
2. **Design**: Choose structure, plan disclosure, name/description
3. **Create**: Write files, validate structure
4. **Test**: Use with real tasks, observe behavior
5. **Iterate**: Refine based on observations
6. **Document**: Ensure clear usage examples

Remember: Start simple, test with real usage, and iterate based on what you learn. Skills are meant to evolve with your needs.

