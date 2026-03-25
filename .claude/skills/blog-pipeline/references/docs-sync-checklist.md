# Docs Sync Checklist

After every blog post is completed and rated 9/10, these files MUST be updated. This is not optional. Skipping this is how competitor pricing stays wrong for weeks and how content inventory goes stale.

## Why This Matters

Stale tracking docs caused a real incident: wrong competitor pricing was displayed for weeks because the inventory wasn't updated after a content change. The formal rule is: after ANY blog/content work, review and update these files.

## Files to Update

### 1. Content Calendar

**File:** `marketing/content/CONTENT-CALENDAR-Q1-2026.md`

**What to update:**
- Find the post in the weekly schedule and update its status:
  - `DRAFT COMPLETE — 9/10, publish-ready` (with brief notes on what makes it unique)
  - `PUBLISHED` (with publication date once live)
- Add to the "What's Actually Live (Ground Truth)" section:
  - Slug, title, category, stage, quality rating, date completed
  - Brief description of unique angle or framework

**How to find the right spot:**
- Posts are organized by week number in the calendar
- The week number is in the content strategy's Q2 plan
- If the post isn't in the calendar yet (impromptu content), add it to the current week

### 2. Content Strategy

**File:** `marketing/CONTENT-STRATEGY-2026.md`

**What to update:**
- Add to the "Published Blog Posts" table:
  - Increment post count
  - Add row with: title, slug, category, date, quality rating, key differentiator
- Mark relevant task in "Next Actions" as complete:
  - Strike through the original task text
  - Add completion metadata (date, quality rating, brief description)

### 3. Keyword Tracker

**File:** `marketing/content/KEYWORD-TRACKER.md`

**What to update:**
- Assign the target page URL to the primary keyword
  - Format: `/blog/<slug>`
- Add secondary keywords with their assigned page if applicable
- If a keyword was previously unassigned, update its status

## Commit Format

Commit all tracking file updates together with the blog post:

```
content: add [article topic] + sync content docs

- New blog post: [slug] ([quality]/10, [type])
- Updated content calendar: Week [N] status, live inventory
- Updated content strategy: published inventory, task #[N] complete
- Updated keyword tracker: [primary keyword] → /blog/[slug]
```

## Quick-Check: Did I Forget Anything?

Run through this mental checklist before committing:

- [ ] Content calendar status updated?
- [ ] Content calendar live inventory updated?
- [ ] Content strategy published posts table updated?
- [ ] Content strategy post count incremented?
- [ ] Content strategy next actions marked complete?
- [ ] Keyword tracker primary keyword assigned?
- [ ] All changes committed together?

If any answer is no, go back and do it. The tracking docs are the single source of truth for content status — stale docs mean wasted work and potential embarrassments.
