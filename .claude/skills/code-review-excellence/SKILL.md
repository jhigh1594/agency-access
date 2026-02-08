---
name: code-review-excellence
description: High-signal code review patterns. Use when reviewing PRs, providing feedback, or establishing review standards.
---

# Code Review Excellence

## Review Priorities

### 1. Correctness (Blocking)
- Does the code do what it's supposed to do?
- Are edge cases handled?
- Are there logic errors?

### 2. Security (Blocking)
- Token/secret handling correct?
- Input validation present?
- Authorization checks in place?
- SQL injection/XSS prevention?

### 3. Architecture (Important)
- Does it fit the existing patterns?
- Is it in the right place?
- Are dependencies appropriate?

### 4. Performance (Important)
- N+1 queries?
- Unnecessary re-renders?
- Missing indexes?

### 5. Maintainability (Suggestions)
- Clear naming?
- Appropriate abstractions?
- Good test coverage?

### 6. Style (Nitpicks)
- Formatting (should be automated)
- Naming conventions
- Comment quality

## Review Checklist

### Security (This Project)
- [ ] No OAuth tokens stored in database (only secretId)
- [ ] Audit log entries for sensitive operations
- [ ] Auth middleware on protected routes
- [ ] Role checks for privileged operations
- [ ] Input validation with Zod

### Code Quality
- [ ] Tests cover new functionality
- [ ] Error handling is appropriate
- [ ] Types are explicit (no implicit any)
- [ ] No console.log in production code

### Architecture
- [ ] Follows existing patterns
- [ ] Services handle business logic
- [ ] Routes are thin
- [ ] Shared types used correctly

## Giving Feedback

### Be Specific
```markdown
// ❌ Vague
"This could be cleaner"

// ✅ Specific
"Consider extracting this validation logic into a `validateAccessRequest` 
function in `lib/validation.ts` to match the pattern used for other entities"
```

### Explain Why
```markdown
// ❌ Just the what
"Use `useMemo` here"

// ✅ Include the why
"This calculation runs on every render. Since `items` changes infrequently, 
wrapping in `useMemo` would prevent unnecessary recalculations"
```

### Offer Alternatives
```markdown
// ❌ Just criticism
"This is hard to read"

// ✅ Constructive
"This nested ternary is hard to follow. Consider:
1. Early return pattern
2. Switch statement
3. Object lookup

Here's option 1:
```typescript
if (!user) return <LoginPrompt />;
if (user.role === 'admin') return <AdminDashboard />;
return <UserDashboard />;
```"
```

### Use Prefixes
- **[blocking]**: Must fix before merge
- **[suggestion]**: Would improve but not required
- **[question]**: Need clarification
- **[nitpick]**: Minor style preference

## Receiving Feedback

### Assume Good Intent
- Reviewers want to help improve the code
- Questions aren't attacks
- Suggestions come from experience

### Respond to All Comments
- Acknowledge feedback
- Explain your reasoning if you disagree
- Ask for clarification if needed

### Don't Take It Personally
- Review is about the code, not you
- Everyone's code can be improved
- Learning is the goal

## PR Best Practices

### Small PRs
- Easier to review thoroughly
- Faster to merge
- Less risk of conflicts

### Clear Description
```markdown
## Summary
- Add token refresh job for Meta connections
- Schedule refresh 5 minutes before expiration

## Changes
- New `token-refresh.ts` worker
- Updated `ConnectionService` to schedule refresh on creation
- Added tests for refresh logic

## Testing
- [x] Unit tests for refresh logic
- [x] Integration test for job scheduling
- [ ] Manual test on staging (pending)

## Security Checklist
- [x] No tokens in database
- [x] Audit log on refresh
```

### Self-Review First
- Read your own diff
- Add comments explaining complex parts
- Fix obvious issues before requesting review

## Automated Checks

### Required Before Review
- [ ] CI passes (lint, typecheck, tests)
- [ ] No security warnings
- [ ] Coverage doesn't decrease

### Automated Tools
- ESLint for code style
- TypeScript for type safety
- Vitest for test coverage
- Dependabot for dependency security
