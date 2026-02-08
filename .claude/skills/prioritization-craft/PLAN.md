# Prioritization Skill: Architecture & Conversion Plan

## Purpose

Documents the conversion of the `/prioritize` command into the enhanced `prioritization-craft` skill, establishing a dual-mode architecture for quick vs. deep prioritization work.

---

## Conversion Complete: Skill Overview

### From Simple to Comprehensive

| Aspect | Before (Old Skill) | After (New Skill) |
|--------|---------------------|-------------------|
| **Lines** | 107 lines | 660 lines |
| **Frameworks** | 2 (RICE, Value/Effort) | 6 (+ICE, Three Buckets, Kano, WSJF) |
| **Modes** | Single (template-fill) | Dual (Interactive/Expert) |
| **Input Handling** | Prepared lists only | Adaptive (raw feedback OR prepared) |
| **Triage Processing** | ❌ None | ✅ Full (gather, normalize, deduplicate, categorize) |
| **Stakeholder Comms** | ❌ None | ✅ Always included (YES/NO templates) |
| **Historical Context** | ❌ None | ✅ References past decisions |
| **Strategic Validation** | ❌ None | ✅ Four Risks, alignment, resource constraints |
| **Output** | Scored list | Roadmap + communication package |

---

## Dual-Mode Architecture

### `/prioritize` Command (Quick Mode)

**Best for:**
- Quick scoring of prepared lists
- Simple ranking decisions
- One-off prioritization needs
- Users who know exactly what they want

**Characteristics:**
- 5-15 minute duration
- No questioning (fill template)
- Direct framework application
- Output: Ranked list

**Use cases:**
```
/prioritize "Score these 5 features with RICE"
/prioritize "Rank my Q2 sprint backlog"
/prioritize "ICE scoring for these items"
```

### `prioritization-craft` Skill (Deep Mode)

**Best for:**
- Processing raw customer feedback
- Quarterly/annual roadmap planning
- High-stakes prioritization with stakeholder communication
- Complex trade-offs requiring strategic validation

**Characteristics:**
- 30-45 minute duration
- Dynamic probing questions based on context
- Multi-phase process (4 phases + toggle)
- Output: Roadmap + stakeholder communication package

**Use cases:**
```
"Skill" invocation or natural language:
"Triage 50 customer enhancement requests for Q2 roadmap"
"Process feedback from 10+ sales calls and build roadmap"
"I have raw feedback from interviews, tickets, and sales—help me prioritize"
"Build annual roadmap with stakeholder communication package"
```

---

## Skill Structure: 4 Phases + Toggle

### Phase 0: Expert Mode Toggle (1 min)
- Interactive Mode: Probing questions throughout
- Expert Mode: Skip to analysis with minimal back-and-forth

### Phase 1: Input Detection & Setup (5-10 min)
- Input type detection (raw vs. prepared)
- Scope clarification (roadmap, sprint, features, etc.)
- Time horizon (short-term vs. long-term)
- Data availability assessment
- Framework selection guidance
- **Historical context check**: Search past prioritization decisions
- Constraint identification (commitments, capacity, strategic mandates)

### Phase 2A: Triage Processing (10-15 min) *RAW FEEDBACK ONLY*
- Gather and preserve (verbatim quotes, frequency counting)
- Summarize and normalize (one-sentence, JTBD mapping, impact assessment)
- Deduplicate (group by problem, not solution)
- Categorize (theme, requester type, strategic fit, work type)
- Signal/noise filtering ("one is noise, ten is signal")

### Phase 2B: Framework Selection & Scoring (10-15 min)
- Framework selection guide (6 frameworks with decision tree)
- Apply selected framework with full scoring
- Handle edge cases (incomplete data, mixed item types)
- **Historical consistency**: Reference past framework choices

### Phase 3: Strategic Validation & Force Ranking (5-10 min)
- Strategic filters (alignment, Four Risks, time horizon, resources)
- Force ranking (no ties, no multiple #1 priorities)
- Draw above/below line
- Capacity validation (can we really do all this?)
- **Historical consistency**: Check against past precedent

### Phase 4: Stakeholder Communication (5-10 min) *ALWAYS INCLUDED*
- What we're saying YES to (why, success criteria, timeline)
- What we're saying NO to (why not now, preserve relationship, revisit trigger)
- Communication templates (YES and NO messages)
- Opportunity cost awareness
- Relationship preservation strategies

---

## Key Features

### 1. Adaptive Workflow Detection

```
┌─ RAW FEEDBACK MODE
│  Input: Verbatim quotes, tickets, interviews, requests
│  → Run Phase 2A (Triage Processing)
│  → Deduplicate by problem (not solution)
│  → Categorize for signal strength
│  → Then Phase 2B (Framework)
│
└─ CLEAN LIST MODE
   Input: Prepared list of items
   → Skip Phase 2A
   → Direct to Phase 2B (Framework)
```

### 2. Six Frameworks with Smart Selection

| Framework | When to Use | Key Inputs |
|-----------|-------------|------------|
| **RICE** | Have quantitative data | Reach, Impact (0.25-3.0), Confidence (%), Effort (person-months) |
| **ICE** | Limited data, quick scoring | Impact, Confidence, Ease (all 1-10) |
| **Value vs Effort** | Stakeholder discussions | Value (high/low), Effort (high/low) |
| **Three Buckets** | Roadmap portfolio balance | Metrics Movers (30-50%), Customer Requests (30-40%), Delight/Innovation (20-30%) |
| **Kano** | Satisfaction vs. investment | Must-Haves, Performance, Delighters |
| **WSJF** | Time-to-market critical | Cost of Delay/month, Duration (months) |

### 3. Historical Context Integration

**What the skill does:**
1. Searches workspace for past prioritization decisions
2. References framework choices for consistency
3. Asks about precedent when new conflicts arise
4. Builds on prior rationale rather than starting fresh

**Questions asked:**
- "Last quarter we used RICE for roadmap planning—should we maintain consistency for comparability?"
- "In Q1 we said NO to [item type]—does this align with that precedent?"
- "Last quarter we prioritized [similar item type] above the line—should we maintain that pattern?"

### 4. Dynamic Questioning Patterns

**Context-aware questions by phase:**

| Phase | Purpose | Example Questions |
|-------|---------|-------------------|
| **Start** | Mode preference | Interactive or Expert Mode? |
| **Phase 1** | Context gathering | Input type? Time horizon? What data? Strategic commitments? |
| **Phase 2A** | Conflict resolution | X vs Y conflict? Non-ICP segment? Blocking vs. nice-to-have? |
| **Phase 2B** | Framework selection | Incomplete data? Mixed item types? Past framework consistency? |
| **Phase 3** | Portfolio balance | Can we really do all 3? Off-strategy but high-score? Capacity constraints? |
| **Phase 4** | Relationship preservation | How to say NO gracefully? Opportunity cost? Executive communication? |

### 5. Stakeholder Communication (Always Included)

**Deliverables:**
- YES messages (what, why, success criteria, timeline)
- NO messages (why not now, preserve relationship, revisit trigger)
- Communication templates (ready to use)
- Opportunity cost documentation

**Relationship Preservation Strategies:**
- Explain rationale clearly (not just "no")
- Revisit trigger (what would change priority)
- Preserve relationship for future requests
- Opportunity cost awareness (what we're giving up)

---

## Integration with AIPMOS

### PM Operating Principles Applied

- **Ruthless Prioritization**: Saying NO more than saying YES
- **Opportunity Cost Awareness**: Every yes to X is saying no to Y
- **Strong Opinions, Loosely Held**: Force rank, but re-prioritize as new data arrives

### Decision Framework Integration

- **One-way vs Two-way Doors**: Reversible decisions use 70% rule
- **Agency Bias Check**: "If you had total ownership, what would you do?"
- **Disagree and Commit**: Once DRI decides, team aligns

### Mental Models Applied

- **Ruthless Prioritization**: Saying NO more than saying YES
- **Opportunity Cost**: Every yes to X is saying no to Y
- **Expected Value**: Reach × Impact × Confidence (account for uncertainty)
- **Time Horizon**: Different priorities for short-term vs. long-term
- **One is Noise, Ten is Signal**: Frequency counts for prioritization
- **Strong Opinions, Loosely Held**: Force rank, but re-prioritize as new data arrives

---

## Completeness Checklist

After skill execution, verify:

- ✅ Clear prioritization scope with context
- ✅ Requests triaged and deduplicated (raw feedback mode)
- ✅ Categorized by theme, requester, strategic fit (raw feedback mode)
- ✅ Framework applied with scoring rationale
- ✅ Force ranked (no ties, above/below line)
- ✅ Strategic validation completed (Four Risks, alignment, constraints)
- ✅ Stakeholder communication package (YES and NO messages)
- ✅ Historical consistency checked
- ✅ Decision rationale documented for future reference

---

## Output Locations

### For RAW FEEDBACK MODE
- **Location**: `memory-bank/triage/[YYYY-MM-DD]-[feature-area]-triage.md`
- **Contents**: Full triage report with normalized requests, deduplication, categorization, scoring, roadmap, stakeholder comms

### For CLEAN LIST MODE
- **Location**: User's choice or same triage directory
- **Contents**: Prioritization analysis with scored items, force-ranked roadmap, stakeholder comms

---

## Training & Documentation Needs

### For Users

Update COMMAND-REFERENCE.md to clarify when to use command vs skill:

```markdown
### /prioritize
**User intent**: Quick prioritization, scoring prepared lists

**When to suggest**:
- "Score these 5 features"
- "Rank my Q2 sprint"
- "ICE scoring for this list"

**NOT for**:
- Raw feedback processing (use prioritization-craft skill)
- Stakeholder communication needed (use prioritization-craft skill)
- Complex triage needed (use prioritization-craft skill)

### prioritization-craft (Skill)
**User intent**: Deep prioritization with stakeholder communication

**When to suggest**:
- "Triage 50 customer requests"
- "Build roadmap with stakeholder buy-in"
- "Process feedback from multiple sources"
- "Need to say NO gracefully"

**NOT for**:
- Quick scoring (use /prioritize command)
- Simple ranking (use /prioritize command)
```

### For Future Skill Conversions

This conversion establishes the pattern for:

1. **synthesize-craft** (next priority) - 1,900+ line command
2. **decide-craft** - Decision-making with agency bias checks
3. **research-craft** - Research planning with Four Risks framework
4. **compete-craft** - Competitive intelligence with source hierarchy

All follow same dual-mode architecture:
- **Command**: Quick, template-based, single-purpose
- **Skill**: Deep, multi-phase, probing questions, comprehensive output

---

## Success Metrics

**Skill adoption indicators:**
- Users choosing skill over command for complex work
- Stakeholder communication quality improving
- Fewer "everything is priority #1" situations
- Consistent framework application across quarters
- Better relationship preservation when saying NO

**Quality indicators:**
- Above/below line clarity
- Rationale documentation quality
- Stakeholder communication effectiveness
- Historical consistency maintained

---

## Version History

- **v1.0** (Current): Initial conversion from simple skill to comprehensive 4-phase prioritization craft with dual-mode architecture

---

**Last Updated**: 2026-02-03
**Based on**: `/prioritize` command (600+ lines) + enhanced skill architecture
**Pattern**: `strategic-thinking` skill as template for deep mode + quick mode duality
