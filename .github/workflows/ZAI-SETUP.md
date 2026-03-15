# z.ai GitHub Actions Setup Guide

## Overview

Automated daily blog post creation using **z.ai API** (GLM models) via GitHub Actions.

## What's Different from Claude Code Actions

| Feature | Claude Code Actions | z.ai Custom Action |
|---------|---------------------|-------------------|
| **Models** | Claude (Sonnet, Opus, Haiku) | GLM (4.7, 5, 4.7-flash) |
| **API Endpoint** | `api.anthropic.com` | `api.z.ai/api/anthropic` |
| **API Key** | `ANTHROPIC_API_KEY` | `ZAI_API_KEY` |
| **Integration** | Official GitHub Action | Custom curl-based workflow |

## Your Current Setup

From your environment:
```bash
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
ZAI_API_KEY=5b5ebf2072ef46dbbc7418644fee387e.UEEsD1C8zLzuFatH
```

**Models you're using:**
- `glm-4.7` (Sonnet equivalent)
- `glm-5` (Opus equivalent)
- `glm-4.7-flash` (Haiku equivalent)

## Setup Steps

### 1. Add z.ai API Key to GitHub Secrets

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `ZAI_API_KEY`
4. Value: `5b5ebf2072ef46dbbc7418644fee387e.UEEsD1C8zLzuFatH`
5. Click **Add secret**

### 2. Commit and Push the Workflow

```bash
git add .github/workflows/blog-creation-zai.yml
git commit -m "Add daily blog creation workflow with z.ai API"
git push
```

### 3. Test the Workflow

**Manual trigger:**
1. Go to repo → **Actions**
2. Select **"Daily Blog Creation with z.ai API"**
3. Click **"Run workflow"** button
4. Select branch: `main`
5. Click **"Run workflow"**

**Automatic trigger:**
- Starts automatically tomorrow at 7:00 AM PST

## How It Works

### Daily Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GitHub Actions triggers at 7:00 AM PST                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Checkout repository                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Read workflow prompt and content files                   │
│    - .claude/prompts/blog-creation-workflow.md             │
│    - marketing/CONTENT-STRATEGY-2026.md                     │
│    - marketing/content/CONTENT-CALENDAR-Q1-2026.md          │
│    - marketing/content/KEYWORD-TRACKER.md                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Call z.ai API with GLM-4.7 model                        │
│    - Endpoint: https://api.z.ai/api/anthropic/v1/messages  │
│    - Model: glm-4.7                                         │
│    - Max tokens: 8000                                       │
│    - Prompt: Execute 7-phase blog creation workflow         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Extract Markdown with YAML frontmatter from response     │
│    - Parse JSON response                                    │
│    - Extract markdown code block or raw content             │
│    - Validate frontmatter format                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Update repository files                                  │
│    - apps/web/content/blog/{slug}.md (create new file)     │
│    - marketing/content/CONTENT-CALENDAR-Q1-2026.md          │
│    - marketing/content/KEYWORD-TRACKER.md                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Create pull request with changes                         │
│    - Title: "📝 Blog Post: AI Generated (YYYY-MM-DD)"       │
│    - Branch: blog-post-YYYYMMDD                             │
│    - Body: Review checklist and summary                     │
└─────────────────────────────────────────────────────────────┘
```

## API Call Details

### Endpoint
```
POST https://api.z.ai/api/anthropic/v1/messages
```

### Headers
```json
{
  "x-api-key": "${{ secrets.ZAI_API_KEY }}",
  "anthropic-version": "2023-06-01",
  "content-type": "application/json"
}
```

### Request Body
```json
{
  "model": "glm-4.7",
  "max_tokens": 8000,
  "system": "You are a content marketing specialist...",
  "messages": [
    {
      "role": "user",
      "content": "Read the blog creation workflow at .claude/prompts/blog-creation-workflow.md and execute all 7 phases..."
    }
  ]
}
```

### Response Format
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "```markdown\n---\nid: blog-post-id\ntitle: ...\n...\n---\n# Headline\n\nBody...\n```"
    }
  ],
  "model": "glm-4.7",
  "stop_reason": "end_turn"
}
```

## Model Selection

### Available GLM Models

| Model | Use Case | Equivalent |
|-------|----------|------------|
| `glm-5` | Highest quality, best for complex tasks | Claude Opus |
| `glm-4.7` | Balanced quality and speed (default) | Claude Sonnet |
| `glm-4.7-flash` | Fast, good for simple tasks | Claude Haiku |

### Change Model in Workflow

Edit `.github/workflows/blog-creation-zai.yml`:

```yaml
"dico/model": "glm-5",  # Use for higher quality
```

Or:

```yaml
"dico/model": "glm-4.7-flash",  # Use for faster generation
```

## Troubleshooting

### Workflow fails with "API Error"

**Check:**
1. Secret name is correct: `ZAI_API_KEY`
2. Secret value is correct: `5b5ebf2072ef46dbbc7418644fee387e.UEEsD1C8zLzuFatH`
3. API endpoint is reachable: `https://api.z.ai/api/anthropic`

**Test locally:**
```bash
curl -X POST "https://api.z.ai/api/anthropic/v1/messages" \
  -H "x-api-key: YOUR_ZAI_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "glm-4.7",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Blog post not extracted correctly

**Check:**
1. Did GLM return a Markdown block with YAML frontmatter (```markdown ... ```)?
2. Does the content start with --- and have id, title, excerpt, etc. in frontmatter?
3. Is the format correct? (Look at `/tmp/zai_response.json` in workflow logs)

**Fix:**
- Adjust the prompt to emphasize output format (YAML frontmatter + markdown body)
- Add examples of expected output format

### Files not updated correctly

**Check:**
1. Blog post format matches content/blog/*.md structure (YAML frontmatter + body)
2. Frontmatter has valid `id` (used as filename: {id}.md)
3. File paths are correct: apps/web/content/blog/
4. Write permissions are correct

## Cost Considerations

### z.ai API Pricing
- Check your z.ai account for current pricing
- GLM models are generally more cost-effective than Claude

### GitHub Actions
- Free within generous limits
- ~5-10 minutes per blog post generation

### Estimated Monthly Cost
- 30 blog posts × ~$0.05-0.10 per post = **$1.50-$3.00/month**

## Comparison: Claude vs. z.ai

| Aspect | Claude (via Anthropic) | z.ai (GLM) |
|--------|------------------------|------------|
| **Model Quality** | State-of-the-art | Very good |
| **Cost** | ~$0.10-0.20 per post | ~$0.05-0.10 per post |
| **Chinese Support** | Good | Excellent |
| **Official Integration** | Yes (GitHub Action) | No (custom) |
| **Setup Complexity** | Low | Medium |

## Cleanup: Remove Old Workflow

If you created the Claude Code workflow earlier:

```bash
rm .github/workflows/blog-creation-daily.yml
git add .github/workflows/blog-creation-daily.yml
git commit -m "Remove Claude Code workflow, using z.ai instead"
git push
```

## Next Steps

1. ✅ Add `ZAI_API_KEY` to GitHub Secrets
2. ✅ Commit and push workflow file
3. ✅ Run manual test (Actions → "Run workflow")
4. ✅ Review first generated PR
5. ✅ Merge if good
6. ✅ Automation begins tomorrow at 7:00 AM PST

---

**Created**: March 13, 2026
**Schedule**: Daily at 7:00 AM PST
**API**: z.ai (GLM-4.7)
**Workflow**: `.github/workflows/blog-creation-zai.yml`
