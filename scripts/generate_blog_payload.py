#!/usr/bin/env python3
"""
Generate JSON payload for z.ai API blog creation request.
Reads context from environment variables and outputs JSON to stdout.
"""
import json
import os

# Read content from environment variables
workflow = os.environ.get('WORKFLOW_PROMPT', '')
patterns = os.environ.get('BLOG_PATTERNS', '')
strategy = os.environ.get('CONTENT_STRATEGY', '')
keywords = os.environ.get('KEYWORD_TRACKER', '')
slugs = os.environ.get('EXISTING_SLUGS', '(none)')

user_content = f"""You are creating a blog post for Agency Access Platform (authhub.co).

=== WORKFLOW INSTRUCTIONS ===
{workflow}

=== BLOG PATTERNS ===
{patterns}

=== CONTENT STRATEGY ===
{strategy}

=== KEYWORD TRACKER ===
{keywords}

=== EXECUTION INSTRUCTIONS ===
Using the workflow instructions above, create a complete blog post:
1. Follow all 7 phases from the workflow instructions
2. Select a topic from KEYWORD TRACKER (prioritize P0 > P1 > P2)
3. Use the blog patterns to match structure by category
4. Apply copywriting_guidance for tone and style
5. Do NOT duplicate an existing slug: {slugs}

When selecting a topic, consider:
- Monthly search volume (higher = more traffic potential)
- Priority level (P0 > P1 > P2)
- Whether a target page is already assigned
- Content pillar alignment

Output ONLY a markdown code block with the complete blog post including YAML frontmatter.

Example format:
```markdown
---
id: your-blog-post-id
title: Compelling Headline (2026)
excerpt: >-
  150-char summary
category: tutorials
stage: awareness
publishedAt: '2026-03-13'
readTime: 5
author:
  name: AuthHub Team
  role: Agency Operations Experts
tags:
  - tag1
  - tag2
metaTitle: SEO title
metaDescription: SEO description
---
# Compelling Headline (2026)

Full markdown body here...
```"""

payload = {
    "model": "glm-4.7",
    "max_tokens": 8000,
    "system": "You are a content marketing specialist for Agency Access Platform (authhub.co). Follow the workflow instructions exactly.",
    "messages": [
        {
            "role": "user",
            "content": user_content
        }
    ]
}

print(json.dumps(payload))
