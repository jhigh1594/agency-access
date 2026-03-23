# SEO Requirements

Every blog post must meet these requirements before moving to editorial polish. These are non-negotiable for publication.

## Frontmatter Requirements

```yaml
---
id: <kebab-case-slug, matches filename>
title: <50-80 chars, includes primary keyword and year for freshness>
excerpt: <2-3 sentences, specific claims, includes keyword naturally>
category: <operations|onboarding|tutorials|comparisons|security|case-studies|research>
stage: <awareness|consideration|decision>
publishedAt: 'YYYY-MM-DD'
readTime: <word count / 200, rounded to nearest integer>
author:
  name: Jon High
  role: Founder
tags: <6-8 tags, primary keyword first>
metaTitle: <50-80 chars, includes keyword, can differ from title for CTR>
metaDescription: <150-160 chars, includes keyword, specific value prop, no vague claims>
relatedPosts: <3-5 slugs of existing posts>
---
```

## Keyword Placement

The primary keyword must appear in these locations:

| Location | Requirement |
|----------|------------|
| **URL/slug** | Yes, kebab-case, include year for listicles (`-2026`) |
| **Title (H1)** | Yes, natural placement |
| **Meta title** | Yes, can rephrase for CTR optimization |
| **Meta description** | Yes, 150-160 chars |
| **First paragraph** | Yes, within first 100 words |
| **At least one H2** | Yes, natural placement |
| **Body text** | 3-5 times total, natural distribution |
| **Image alt text** | If images present |
| **Tags** | First tag is the primary keyword |

## Internal Linking

**Minimum 3-5 internal links per post.** Links should:

- Use **descriptive anchor text** that includes relevant keywords (not "click here" or "read more")
- Point to **existing published posts** — check `apps/web/content/blog/` for available slugs
- Be **woven into the body text naturally** — not dumped in a "Related Reading" section at the bottom
- Point to posts that are **topically relevant** — don't link just for SEO
- Use the **post slug** in the `relatedPosts` frontmatter array

**Cross-linking strategy:**
- Platform tutorials should link to other platform tutorials ("If you also need LinkedIn access, see...")
- Operations posts should link to tutorials ("Here's how to actually get Meta access")
- Pillar posts should link to everything relevant (they're the hub)
- New posts should link to existing posts — existing posts will be updated to link back in a future pass

## External Linking

**Minimum 2-3 external links per post.** External sources should be:

- **Authoritative** — industry reports (Gartner, Forrester), platform documentation, well-known publications
- **Specific** — link to the specific page/stat, not a homepage
- **Cited** — when referencing a statistic, link to the source in the same sentence
- **Diverse** — don't link to the same domain 3 times

**Acceptable external sources:**
- Platform documentation (developers.facebook.com, support.google.com, etc.)
- Industry research (HubSpot State of Marketing, Content Marketing Institute, etc.)
- Reputable publications (Harvard Business Review, Forbes, TechCrunch — for specific data points)
- Tool websites (for pricing and feature verification)

**Not acceptable:**
- Competitor websites (don't link to Leadsie, etc.)
- Generic/unverifiable sources
- Sites with no clear authorship or editorial standards

## Featured Snippet Targeting

Structure content to win Google's featured snippets (Position Zero):

**For definitions (category-defining posts):**
- First 50 words should be a clear, self-contained definition
- Use the format: "[Term] is [definition]. [One key differentiator]."

**For processes/tutorials:**
- Use numbered lists for step-by-step instructions
- Keep each step to one sentence
- Include the keyword in the list intro

**For comparisons:**
- Use a table format early in the post
- Include column headers that match common search queries
- Keep table scannable (no paragraphs in cells)

**For "best of" listicles:**
- Include a brief one-sentence summary for each item
- Use consistent formatting across all items
- Include pricing where applicable

## Meta Description Guidelines

- **Length:** 150-160 characters (Google truncates beyond ~160)
- **Include the primary keyword** naturally
- **Include specific value** — what will the reader learn or gain?
- **No vague claims** — "Learn everything about X" is weak; "Save 8-12 hours per month on client platform access" is strong
- **Match search intent** — informational queries want answers, commercial queries want comparisons

## Read Time Calculation

Formula: `word count / 200` (average reading speed), rounded to nearest integer.

Target read times by article type:
- Category-defining: 8-10 min
- Pillar: 12-18 min
- Listicle: 10-15 min
- Tutorial: 9-12 min
- Comparison: 8-12 min

## Cannibalization Check

Before publishing, verify the new post doesn't compete with existing posts for the same keyword:

1. Check `marketing/content/KEYWORD-TRACKER.md` for existing keyword assignments
2. Search `apps/web/content/blog/` for posts targeting similar keywords
3. If overlap exists:
   - If the new post is better: add a canonical URL from the old post to the new one
   - If the old post is better: merge the new content into the old post
   - If they serve different intents: differentiate the titles and meta descriptions clearly

## URL Structure

- **Format:** `/blog/<kebab-case-slug>`
- **Year suffix:** Include `-2026` in the slug for listicles and time-sensitive content
- **No dates in URL:** Don't use `/blog/2026/03/post-slug` format
- **Canonical:** If a dedicated `/guides/` page exists for the same topic, add a `canonical` field in frontmatter pointing to it
