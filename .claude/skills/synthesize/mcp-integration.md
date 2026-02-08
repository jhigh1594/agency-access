# MCP Integration Examples

This file describes how the customer-feedback-synthesis skill integrates with MCP servers for data retrieval and storage.

---

## Granola MCP: Meeting Data

### Fetch meetings for synthesis

```javascript
// The synthesis skill can invoke:
mcp__granola__search_meetings({
  query: "customer interviews",
  limit: 20
})

// Returns meeting IDs, then fetch details:
mcp__granola__get_meeting_details({
  meeting_id: "meeting-id-123"
})

// Get transcript for synthesis:
mcp__granola__get_meeting_transcript({
  meeting_id: "meeting-id-123"
})
```

### Usage pattern

```bash
# Example invocation
Use customer-feedback-synthesis skill to analyze January 2026 customer meetings from Granola

# AI will:
# 1. Search Granola for relevant meetings
# 2. Fetch transcripts
# 3. Extract atomic nuggets
# 4. Apply synthesis frameworks
# 5. Generate insights and opportunities
```

### When to use Granola MCP

✅ **Meeting transcript analysis**
- Customer interviews stored in Granola
- Customer advisory board meetings
- Sales call notes with customer feedback
- User testing sessions

✅ **Multi-meeting synthesis**
- Pattern analysis across multiple customer meetings
- Quarterly customer feedback review
- Trend identification over time

---

## Notion MCP: Research Repository

### Store synthesis reports

```javascript
// After synthesis completes, store in Notion:
mcp__notion__notion-create-pages({
  parent: {data_source_id: "research-database-id"},
  pages: [{
    properties: {
      "Title": "Q1 2026 Customer Feedback Synthesis",
      "Type": "Synthesis Report",
      "Date": "2026-01-21",
      "Status": "Complete"
    },
    content: "[Full synthesis report in Notion Markdown]"
  }]
})
```

### Search historical syntheses

```javascript
// Find previous synthesis for comparison:
mcp__notion__notion-search({
  query: "dependency management synthesis",
  query_type: "internal",
  data_source_url: "collection://research-database-id"
})
```

### Usage pattern

```bash
# After synthesis completes
Use customer-feedback-synthesis skill → Generate synthesis report
Then: Store in Notion research database for future reference
```

### When to use Notion MCP

✅ **Long-term storage**
- Quarterly synthesis reports
- Historical pattern tracking
- Research knowledge base

✅ **Cross-reference**
- Compare current synthesis to previous periods
- Track pattern evolution over time
- Build organizational research memory

---

## AgilePlace MCP: Opportunity Tracking

### Create opportunity cards from top insights

```javascript
// After identifying top 3 opportunities:
mcp__agileplace__create_card({
  board_id: "roadmap-board-id",
  lane_id: "opportunities-lane-id",
  title: "Proactive Dependency Risk Alerts",
  description: "**Insight:** Enterprise teams spend 3+ hrs/week manually tracking...\n\n**Evidence:** 14 mentions across 12 ICP customers...\n\n**Opportunity:** Build intelligent risk scoring...",
  priority: "high",
  tags_json: JSON.stringify(["synthesis", "q1-2026", "dependencies"])
})
```

### Usage pattern

```bash
# After synthesis identifies opportunities
Use customer-feedback-synthesis skill → Output: Top 3 prioritized opportunities
Then: Create AgilePlace cards for each top opportunity
```

### When to use AgilePlace MCP

✅ **Roadmap integration**
- Move synthesis insights to roadmap
- Create opportunity cards from findings
- Track validation activities

✅ **Stakeholder visibility**
- Make synthesis findings visible to team
- Link opportunities to customer evidence
- Track progress on top opportunities

---

## Integration Workflow Examples

### Example 1: Quarterly Synthesis with MCP Integration

```bash
# Step 1: Fetch data from Granola
mcp__granola__search_meetings({
  query: "customer interviews Q1 2026",
  limit: 15
})

# Step 2: Run synthesis
Use customer-feedback-synthesis skill to analyze Q1 customer interviews

# Step 3: Store report in Notion
mcp__notion__notion-create-pages({
  parent: {data_source_id: "research-db"},
  pages: [{...synthesis report...}]
})

# Step 4: Create opportunity cards in AgilePlace
mcp__agileplace__create_card({
  board_id: "roadmap-board",
  title: "Top opportunity from synthesis",
  ...
})
```

---

### Example 2: Continuous Discovery Pattern Tracking

```bash
# Step 1: Search previous synthesis
mcp__notion__notion-search({
  query: "Q4 2025 dependency synthesis",
  data_source_url: "collection://research-db"
})

# Step 2: Compare with current synthesis
Use customer-feedback-synthesis skill → Analyze Q1 2026 data
Identify trends: emerging, stable, declining, resolved

# Step 3: Update pattern tracking in Notion
mcp__notion__notion-update-page({
  page_id: "pattern-tracking-page",
  properties: {
    "Q1 2026 Trends": "[Updated patterns]"
  }
})
```

---

### Example 3: Customer Advisory Board Synthesis

```bash
# Step 1: Fetch CAB meetings from Granola
mcp__granola__search_meetings({
  query: "customer advisory board",
  filters: {
    created_date_range: {
      start_date: "2026-01-01",
      end_date: "2026-03-31"
    }
  }
})

# Step 2: Synthesize CAB feedback
Use customer-feedback-synthesis skill to analyze CAB feedback

# Step 3: Store in Notion research repo
mcp__notion__notion-create-pages({
  parent: {data_source_id: "cab-research-db"},
  pages: [{...CAB synthesis...}]
})

# Step 4: Create executive brief
/writing "CAB Insights Executive Summary for CEO"
# Use synthesis findings as input
```

---

## MCP Integration Checklist

When using synthesis with MCP servers:

### Data Retrieval (Before Synthesis)
- [ ] Granola: Search for relevant meetings
- [ ] Granola: Fetch meeting details and transcripts
- [ ] Notion: Search for historical syntheses (if comparing)

### Synthesis Execution
- [ ] Use customer-feedback-synthesis skill
- [ ] Apply all 7 frameworks as appropriate
- [ ] Generate insights and opportunities

### Data Storage (After Synthesis)
- [ ] Notion: Store synthesis report
- [ ] Notion: Update pattern tracking (if continuous)
- [ ] AgilePlace: Create opportunity cards (if applicable)
- [ ] AgilePlace: Link to customer evidence

---

## Summary: MCP Server Matrix

| MCP Server | Role | When to Use |
|------------|------|-------------|
| **Granola** | Data source | Meeting transcript analysis, multi-meeting synthesis |
| **Notion** | Storage/retrieval | Long-term research storage, historical comparison |
| **AgilePlace** | Action tracking | Move insights to roadmap, opportunity cards |
