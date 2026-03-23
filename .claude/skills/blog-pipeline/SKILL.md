---
name: blog-pipeline
description: End-to-end blog post creation pipeline for AuthHub — from strategic research through publish-ready article with docs sync. Use this skill whenever creating a new blog post, writing an article, drafting content, or the user mentions "blog post", "article", "new content", "write a post", "create content", or anything related to publishing blog content. Also triggers when the user references the content calendar, content strategy, or says things like "let's write the next post" or "time for the Thursday post." This is the ONLY skill you need for blog content creation — it replaces manual coordination of elite-copywriter, copy-editing, seo-audit, and content-strategy for blog workflows.
---

# Blog Pipeline

End-to-end content creation: research, brief, draft, SEO, editorial polish, quality review, docs sync. Every post follows this pipeline. No shortcuts, no phases skipped.

## Why This Skill Exists

Creating a blog post isn't just writing — it's a production pipeline with seven phases, quality gates between each, and mandatory documentation updates afterward. Without this pipeline, posts end up with inconsistent quality, missing SEO elements, stale tracking docs, and no strategic alignment. This skill encodes the workflow that produced the 9/10-rated posts in the content corpus.

## Phase 1: Research & Positioning

Before writing a single word, understand where this post fits strategically.

**Read these files:**
1. `marketing/CONTENT-STRATEGY-2026.md` — content pillars, brand voice, production workflow
2. `marketing/content/CONTENT-CALENDAR-Q1-2026.md` — what's scheduled, what's done, what's next
3. `marketing/content/KEYWORD-TRACKER.md` — target keywords and their assigned pages

**Then determine:**
- Which content pillar this serves (competitive alternatives, platform guides, onboarding best practices, agency growth)
- Target keyword and buyer stage (awareness / consideration / decision)
- Article type — pick from the templates in `references/article-templates.md`
- Competitive angle — what makes this different from what already ranks
- Whether existing posts cover similar ground (cannibalization check)

**Gate:** If no clear strategic gap exists, stop and propose alternatives before writing. Don't create content that competes with your own posts.

## Phase 2: Content Brief

Define the article's specs before drafting. This phase is skippable when the content calendar already documents the direction (topic, angle, keyword, type) — just confirm the details and proceed.

When the direction isn't pre-documented, define:
- **Article type** (pillar, listicle, tutorial, comparison, category-defining)
- **Target keyword** and secondary keywords
- **Working title** (50-80 chars, includes year for freshness signal)
- **Slug** (kebab-case, includes year suffix for listicles and guides)
- **Target word count** and read time (word count / 200)
- **Buyer stage** (awareness / consideration / decision)
- **Category** (operations, onboarding, tutorials, comparisons, security, case-studies, research)
- **Internal links** — identify 3-5 existing posts to cross-link
- **External sources** — plan for 2-3 authoritative citations
- **CTA placement** — where AuthHub gets mentioned naturally

**Gate:** User confirms direction (or it's already confirmed in the calendar).

## Phase 3: First Draft

Write the full article following the type-specific template from `references/article-templates.md`.

**File location:** `apps/web/content/blog/<slug>.md`

**Frontmatter format** (every post must have this exact structure):
```yaml
---
id: <slug>
title: <H1 Title — Optional Subtitle>
excerpt: >-
  2-3 sentence compelling excerpt with specific, quantified claims.
  Include the primary keyword naturally. No hedging.
category: <operations|onboarding|tutorials|comparisons|security|case-studies|research>
stage: <awareness|consideration|decision>
publishedAt: 'YYYY-MM-DD'
readTime: <integer>
author:
  name: Jon High
  role: Founder
tags:
  - <primary keyword>
  - <2-5 related tags, 6-8 total>
metaTitle: <SEO title, 50-80 chars, includes keyword>
metaDescription: >-
  150-160 chars. Include keyword. Specific value proposition.
  No vague claims.
relatedPosts:
  - <slug-1>
  - <slug-2>
  - <3-5 related post slugs>
---
```

**Writing rules for the draft:**

Write naturally. Don't think about "copywriting" — think about explaining this to a smart agency owner who's busy and wants the answer, not a lecture.

- Open with the reader's problem, not your solution. Vignettes, scenarios, and surprising statistics work better than "In today's fast-paced world..."
- One idea per paragraph. Short sentences. Active voice.
- Use "you" more than "we" or "I" — the reader is the hero
- Specific numbers over vague claims ("$1,500/month" not "significant cost savings")
- Include the primary keyword in: title, first paragraph, at least one H2
- Don't write the meta-commentary sections (no "Why this matters", "The takeaway", "Key insight" headers) — the content should demonstrate value, not explain it
- Weave AuthHub mentions in naturally where the problem aligns — don't force a CTA where it doesn't fit
- Include internal links to related posts as natural references, not link dumps

**Gate:** Draft complete with all sections, frontmatter, and cross-links. Move to optimization.

## Phase 4: SEO Optimization

Read `references/seo-requirements.md` for the full checklist. The essentials:

1. **Primary keyword placement:** title, slug, H1, first paragraph, meta description, at least one H2
2. **Internal links:** 3-5 links to existing posts, using descriptive anchor text (not "click here")
3. **External links:** 2-3 authoritative sources with real attribution
4. **Featured snippet targeting:** use structured lists, tables, or clear definitions that Google can extract
5. **Meta description:** 150-160 chars, includes keyword, has specific value proposition
6. **Read time:** calculate from actual word count (word count / 200)
7. **Tags:** 6-8 relevant tags including primary keyword
8. **relatedPosts:** 3-5 slugs of existing posts

**Gate:** Every SEO element present and correct. No placeholder text.

## Phase 5: Editorial Polish

This is the pass that separates 7/10 from 9/10. Read `references/quality-checklist.md` for the full banned words list and scoring rubric. The key moves:

1. **Cut 20-30%** — every word must earn its place. Remove filler sentences, redundant qualifiers ("if applicable", "if different from primary"), and paragraphs that restate what was already said
2. **Kill AI-isms** — see the banned words list. These are instant quality killers
3. **Active voice throughout** — "Agencies lose 8-12 hours" not "8-12 hours are lost by agencies"
4. **Strong verbs over weak ones** — "Slash" not "reduce", "Skyrocket" not "increase"
5. **Specific over vague** — real numbers, real examples, real tool names. No "many agencies" or "significant improvement"
6. **Natural transitions** — no label-style headers ("BOTTOM LINE:", "CONTEXT:", "HERE'S THE THING"). Sections should flow into each other
7. **Remove meta-commentary** — if a section needs "Why this matters" to justify its existence, the section isn't pulling its weight. Cut the section or make it self-evidently valuable
8. **Check every statistic** — if you can't cite a source, rephrase as an observation or remove it

**Gate:** The article reads like something a respected peer would write, not AI output. No detectable patterns.

## Phase 6: Quality Review

Rate the post on the 1-10 scale. Be honest — inflating scores defeats the purpose.

| Score | Meaning | Action |
|-------|---------|--------|
| 9-10 | Publish-ready | Proceed to docs sync |
| 8-8.5 | Strong but needs tightening | One more pass at Phase 5 |
| 7-7.5 | Good draft, gaps remain | Identify specific gaps, address, re-polish |
| Below 7 | Needs substantive work | Re-evaluate approach, possibly rewrite |

**What a 9/10 looks like** (based on the corpus):
- Original angle no competitor covers
- 3-5 sourced statistics with real attribution
- Framework or model the reader can apply (not just advice)
- Honest AuthHub positioning (not advertorial)
- Strong internal linking woven naturally into the text
- Zero AI-detectable patterns
- The reader finishes thinking "this person actually understands my problem"

**Gate:** Minimum 9/10 to proceed. If you can't get there, identify what's missing and tell the user.

## Phase 7: Docs Sync (MANDATORY)

Every blog post MUST trigger updates to tracking documents. This is not optional. Skipping this is how competitor pricing stays wrong for weeks.

**Update these files:**

1. **`marketing/content/CONTENT-CALENDAR-Q1-2026.md`**
   - Update status in the weekly schedule (mark as DRAFT COMPLETE or PUBLISHED)
   - Add quality rating (e.g., "9/10, publish-ready")
   - Add to "What's Actually Live" inventory section
   - Add brief notes about what makes the post unique

2. **`marketing/CONTENT-STRATEGY-2026.md`**
   - Add to published blog posts inventory table
   - Update post count
   - Mark relevant task in Next Actions as complete (with date)

3. **`marketing/content/KEYWORD-TRACKER.md`**
   - Assign target page URL to the primary keyword
   - Add secondary keywords if applicable

**Commit all changes together** with a descriptive message including the post title.

**Gate:** All three tracking files updated and committed. Session complete.

## When NOT to Use This Skill

- Updating existing published posts (use `copy-editing` or `elite-copywriter` for polish passes)
- Writing marketing page copy (homepage, pricing, features — use `copywriting` instead)
- Social media content (use `social-content`)
- Email sequences (use `email-sequence`)
- Product documentation or technical specs

## Optional: Deeper Passes

For posts that need extra polish beyond the pipeline, these skills can supplement (not replace) the pipeline:
- `elite-copywriter` — for executive communications, case studies, or positioning content
- `copy-editing` — for the seven-sweep framework on already-solid drafts
- `seo-audit` — for technical SEO beyond the baseline requirements
