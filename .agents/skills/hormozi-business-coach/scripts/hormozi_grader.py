#!/usr/bin/env python3
"""
Hormozi Business Grader
Calculates a Hormozi Score (1-10) based on Alex Hormozi's frameworks.
Accepts JSON input via stdin or --input flag, outputs structured JSON assessment.

Usage:
    echo '{"gross_margin": 0.85, "payback_period": 25, ...}' | python3 hormozi_grader.py
    python3 hormozi_grader.py --input '{"gross_margin": 0.85, ...}'
"""

import json
import sys
import argparse
from dataclasses import dataclass
from typing import Optional


@dataclass
class BusinessInputs:
    # Required fields
    gross_margin: float  # 0.0 - 1.0
    payback_period: int  # days to recover CAC
    avatar_type: str  # "B2B" or "B2C"
    avatar_income: str  # "High", "Medium", "Low"
    model: str  # "Recurring", "One-Time", "Hybrid"
    retention_rate: float  # 0.0 - 1.0 (monthly)
    product_count: int
    channel_count: int
    constraint_type: str  # "Supply" or "Demand"
    monthly_revenue: float
    price_point: float
    ltv: float  # lifetime gross profit per customer
    cac: float  # customer acquisition cost

    # Optional diagnostic fields
    daily_outreach: int = 0
    close_rate: float = 0.0
    avatar_count: int = 1
    has_tracking: bool = False
    owner_in_delivery: bool = True
    business_count: int = 1
    dream_outcome_clarity: str = "Unclear"  # "Clear", "Somewhat", "Unclear"
    perceived_likelihood: str = "Low"  # "High", "Medium", "Low"
    time_to_result_days: int = 90
    effort_level: str = "DIY"  # "DFY", "DWY", "DIY"


def calculate_hormozi_score(b: BusinessInputs) -> dict:
    """Calculate the Hormozi Score with detailed breakdown."""
    breakdown = {}
    score = 0.0

    # 1. PRICING POWER (Weight: 2.0)
    # "Pricing is the single biggest lever on profit."
    if b.gross_margin > 0.80:
        pts = 2.0
        note = f"Elite margins at {b.gross_margin:.0%}. This is where real wealth lives."
    elif b.gross_margin > 0.65:
        pts = 1.5
        note = f"Decent margins at {b.gross_margin:.0%}. You're leaving money on the table by not charging more."
    elif b.gross_margin > 0.50:
        pts = 1.0
        note = f"Thin margins at {b.gross_margin:.0%}. You're working too hard for too little."
    else:
        pts = 0.0
        note = f"Broke margins at {b.gross_margin:.0%}. You don't have a business, you have a job that doesn't pay well."
    breakdown["pricing_power"] = {"score": pts, "max": 2.0, "note": note}
    score += pts

    # 2. CASH FLOW SPEED (Weight: 2.0)
    # "Payback period must be < 30 days for infinite scaling."
    if b.payback_period <= 30:
        pts = 2.0
        note = f"{b.payback_period}-day payback. Client-financed acquisition unlocked. This is the cheat code."
    elif b.payback_period <= 60:
        pts = 1.5
        note = f"{b.payback_period}-day payback. Close but you're still financing your own growth. Compress this."
    elif b.payback_period <= 90:
        pts = 1.0
        note = f"{b.payback_period}-day payback. You're bleeding cash waiting to get paid. Fix this or die slow."
    else:
        pts = 0.0
        note = f"{b.payback_period}-day payback. You're a bank giving out free loans. Stop it."
    breakdown["cash_flow_speed"] = {"score": pts, "max": 2.0, "note": note}
    score += pts

    # 3. AVATAR SELECTION (Weight: 1.5)
    # "Sell to rich people. It's the same amount of work."
    if b.avatar_type == "B2B" and b.price_point >= 5000:
        pts = 1.5
        note = "B2B with premium pricing. Smart. Rich people pay faster and complain less."
    elif b.avatar_type == "B2B" or b.avatar_income == "High":
        pts = 1.0
        note = "Right direction. But are you charging what it's worth or what you're comfortable asking for?"
    elif b.avatar_income == "Medium":
        pts = 0.5
        note = "Medium-income avatar. You'll always be fighting for every dollar. Move upstream."
    else:
        pts = 0.0
        note = "Selling to broke people. The math will never work. Same effort, way less money."
    breakdown["avatar_selection"] = {"score": pts, "max": 1.5, "note": note}
    score += pts

    # 4. RECURRING REVENUE (Weight: 1.5)
    # "Don't want to be in the sales business, want to be in the re-selling business."
    if b.model == "Recurring" and b.retention_rate > 0.90:
        pts = 1.5
        note = f"Recurring with {b.retention_rate:.0%} retention. This is a money printer. Protect it."
    elif b.model == "Recurring" and b.retention_rate > 0.80:
        pts = 1.0
        note = f"Recurring but {b.retention_rate:.0%} retention. You're filling a leaky bucket. Fix delivery."
    elif b.model == "Recurring":
        pts = 0.5
        note = f"Recurring with {b.retention_rate:.0%} retention. You're churning faster than you're growing. Your product sucks or your promise is wrong."
    elif b.model == "Hybrid":
        pts = 0.5
        note = "Hybrid model. Better than one-time, but pick a lane."
    else:
        pts = 0.0
        note = "One-time sales. You wake up every month at zero. That's not a business, that's a hustle."
    breakdown["recurring_revenue"] = {"score": pts, "max": 1.5, "note": note}
    score += pts

    # 5. EXECUTION & FOCUS (Weight: 2.0)
    # "One Avatar, One Channel, One Product."
    focus_score = 0.0
    if b.product_count == 1:
        focus_score += 0.7
    elif b.product_count <= 3:
        focus_score += 0.3
    if b.channel_count == 1:
        focus_score += 0.7
    elif b.channel_count <= 2:
        focus_score += 0.3
    if b.avatar_count == 1:
        focus_score += 0.6

    pts = min(focus_score, 2.0)
    if pts >= 1.8:
        note = "Laser focused. One avatar, one channel, one product. This is how you get to $1M fast."
    elif pts >= 1.0:
        note = f"{b.product_count} products, {b.channel_count} channels, {b.avatar_count} avatars. You're spreading thin. The woman in the red dress is distracting you."
    else:
        note = f"{b.product_count} products, {b.channel_count} channels. You're running multiple businesses disguised as one. Pick the best one, kill the rest."
    breakdown["execution_focus"] = {"score": round(pts, 1), "max": 2.0, "note": note}
    score += pts

    # 6. DEMAND CONSTRAINT (Weight: 1.0)
    # "Supply constrained businesses are better than demand constrained."
    if b.constraint_type == "Supply":
        pts = 1.0
        note = "Supply constrained. Good problem. You have more demand than you can handle. Now systematize delivery."
    else:
        pts = 0.0
        note = "Demand constrained. You need more leads. Are you doing the Rule of 100?"
    breakdown["demand_constraint"] = {"score": pts, "max": 1.0, "note": note}
    score += pts

    final_score = min(round(score, 1), 10.0)
    return {"score": final_score, "breakdown": breakdown}


def calculate_value_equation(b: BusinessInputs) -> dict:
    """Analyze the Value Equation: (Dream Outcome × Likelihood) / (Time × Effort)"""
    # Dream Outcome Clarity: 1-3
    do_score = {"Clear": 3, "Somewhat": 2, "Unclear": 1}.get(b.dream_outcome_clarity, 1)

    # Perceived Likelihood: 1-3
    pl_score = {"High": 3, "Medium": 2, "Low": 1}.get(b.perceived_likelihood, 1)

    # Time Delay: inverse scale (lower time = higher score)
    if b.time_to_result_days <= 7:
        td_score = 1.0  # minimal friction
    elif b.time_to_result_days <= 30:
        td_score = 2.0
    elif b.time_to_result_days <= 90:
        td_score = 3.0
    else:
        td_score = 4.0  # maximum friction

    # Effort Level
    effort_scores = {"DFY": 1.0, "DWY": 2.0, "DIY": 3.0}
    ef_score = effort_scores.get(b.effort_level, 3.0)

    numerator = do_score * pl_score
    denominator = td_score * ef_score
    value_ratio = round(numerator / denominator, 2) if denominator > 0 else 0

    if value_ratio >= 2.0:
        verdict = "Grand Slam Offer territory. High dream outcome, high certainty, low friction."
    elif value_ratio >= 1.0:
        verdict = "Decent offer but not irresistible. Reduce time to result or increase proof."
    elif value_ratio >= 0.5:
        verdict = "Weak offer. Too much effort required for an uncertain outcome. Nobody's buying this with excitement."
    else:
        verdict = "Trash offer. You're asking people to work hard, wait forever, with no proof it'll work. Rebuild from scratch."

    return {
        "value_ratio": value_ratio,
        "numerator": {"dream_outcome": do_score, "perceived_likelihood": pl_score, "combined": numerator},
        "denominator": {"time_delay": td_score, "effort_sacrifice": ef_score, "combined": denominator},
        "verdict": verdict,
    }


def calculate_ltv_cac(b: BusinessInputs) -> dict:
    """Analyze LTV:CAC ratio with Hormozi benchmarks."""
    if b.cac == 0:
        ratio = float("inf")
        ratio_display = "∞ (organic)"
    else:
        ratio = round(b.ltv / b.cac, 1)
        ratio_display = f"{ratio}:1"

    # Benchmarks depend on business type
    if b.model == "Recurring":
        if ratio >= 12:
            grade = "A+"
            note = f"LTV:CAC of {ratio_display}. For a recurring model, this is a license to print money."
        elif ratio >= 6:
            grade = "B+"
            note = f"LTV:CAC of {ratio_display}. Good for recurring, but you should be at 12:1+."
        elif ratio >= 3:
            grade = "C"
            note = f"LTV:CAC of {ratio_display}. Barely viable. Your retention is probably the problem."
        else:
            grade = "F"
            note = f"LTV:CAC of {ratio_display}. You're paying more to get customers than they're worth. Stop spending on ads."
    else:
        if ratio >= 6:
            grade = "A"
            note = f"LTV:CAC of {ratio_display}. Strong economics for a non-recurring model."
        elif ratio >= 3:
            grade = "B"
            note = f"LTV:CAC of {ratio_display}. Workable but thin. Raise prices or add an upsell."
        else:
            grade = "F"
            note = f"LTV:CAC of {ratio_display}. Broken unit economics. Don't scale this."

    return {"ratio": ratio_display, "grade": grade, "note": note}


def identify_constraints(b: BusinessInputs) -> list:
    """Run the Six Constraints diagnostic."""
    constraints = []

    # 1. Underpriced
    if b.gross_margin < 0.65:
        constraints.append({
            "constraint": "UNDERPRICED",
            "severity": "Critical" if b.gross_margin < 0.40 else "Warning",
            "diagnosis": f"Gross margin at {b.gross_margin:.0%}. You're afraid to charge what it's worth. Raise prices 2x tomorrow. The ones who leave weren't your customers anyway."
        })

    # 2. Low Volume
    if b.daily_outreach < 100 and b.constraint_type == "Demand":
        constraints.append({
            "constraint": "LOW VOLUME",
            "severity": "Critical",
            "diagnosis": f"You're doing {b.daily_outreach} outreaches/day. The Rule of 100: 100 cold calls, 100 DMs, 100 emails. Every. Single. Day. You don't have a lead problem, you have a work ethic problem."
        })

    # 3. Overextension (The Woman in the Red Dress)
    if (b.product_count > 1 or b.channel_count > 2 or b.avatar_count > 1) and b.monthly_revenue < 83333:
        constraints.append({
            "constraint": "OVEREXTENSION",
            "severity": "Critical" if b.monthly_revenue < 83333 else "Warning",
            "diagnosis": f"You're running {b.product_count} products across {b.channel_count} channels for {b.avatar_count} avatar(s) at ${b.monthly_revenue:,.0f}/mo. The Woman in the Red Dress. Pick ONE until you're past $1M/year."
        })

    # 4. Multiple Businesses
    if b.business_count > 1:
        constraints.append({
            "constraint": "MULTIPLE BUSINESSES",
            "severity": "Critical",
            "diagnosis": f"You're running {b.business_count} businesses. Show me one billionaire who got rich running two things at once below $10M. I'll wait. Kill everything except the one with the best unit economics."
        })

    # 5. No Data Daddy
    if not b.has_tracking:
        constraints.append({
            "constraint": "NO DATA DADDY",
            "severity": "Critical",
            "diagnosis": "You don't track your numbers. You're flying blind. If you don't know your lead count, show rate, close rate, and LTV, you're not running a business. You're gambling."
        })

    # 6. Owner in Delivery
    if b.owner_in_delivery and b.monthly_revenue > 25000:
        constraints.append({
            "constraint": "FOUNDER BOTTLENECK",
            "severity": "Warning" if b.monthly_revenue < 50000 else "Critical",
            "diagnosis": f"You're still in delivery at ${b.monthly_revenue:,.0f}/mo. You are the constraint. Remove yourself from fulfillment or you'll never scale past where you are right now."
        })

    if not constraints:
        constraints.append({
            "constraint": "NONE DETECTED",
            "severity": "Info",
            "diagnosis": "No obvious structural constraints. Either you're crushing it or you lied on the intake form. Let's dig deeper."
        })

    return constraints


def determine_stage(b: BusinessInputs) -> dict:
    """Categorize business into Hormozi's scaling stages."""
    annual = b.monthly_revenue * 12

    if annual < 1_000_000:
        stage = "Pre-$1M"
        directive = "One Avatar. One Channel. One Product. Focus on MORE — more volume, more outreach, more reps. Nothing else matters."
        focus = "Volume"
        forbidden = "Do NOT add products. Do NOT add channels. Do NOT hire. Just do more of what's working."
    elif annual < 3_000_000:
        stage = "$1M-$3M"
        directive = "The hardest phase. You need your first layer of management and you need to operationalize delivery. This is where most people break."
        focus = "Operations"
        forbidden = "Do NOT chase a second product line. Do NOT open new channels. Systematize what you have."
    elif annual < 10_000_000:
        stage = "$3M-$10M"
        directive = "Remove yourself as the constraint. You cannot be the rainmaker AND the deliverer. Build the machine that builds the machine."
        focus = "Keyman Risk Removal"
        forbidden = "Do NOT stay in day-to-day operations. Do NOT be the best salesperson. Train replacements or the business dies when you burn out."
    else:
        stage = "$10M+"
        directive = "You're in portfolio territory. Focus on enterprise value, not just cash flow. Consider acquisition over organic growth."
        focus = "Enterprise Value"
        forbidden = "Do NOT micromanage. You should be working ON the portfolio, not IN any single business."

    return {"stage": stage, "annual_revenue": annual, "directive": directive, "focus": focus, "forbidden": forbidden}


def generate_verdict(score: float) -> str:
    """Generate the Hormozi-style verdict."""
    if score >= 8.5:
        return "UNICORN — This is a cash printing machine. Don't screw it up by getting bored and chasing something new."
    elif score >= 7.0:
        return "CASH COW — Strong fundamentals. Fix the weak spots and this is a $10M+ business."
    elif score >= 5.0:
        return "WORKHORSE — It works but it's not great. You're probably working harder than you should for what you're making."
    elif score >= 3.0:
        return "VAMPIRE — This business is sucking the life out of you. Major structural changes needed or walk away."
    else:
        return "DEAD ON ARRIVAL — This doesn't work. Not 'needs improvement.' Doesn't. Work. Pivot or quit."


def run_full_assessment(data: dict) -> dict:
    """Run the complete Hormozi assessment."""
    b = BusinessInputs(**data)

    grader = calculate_hormozi_score(b)
    value_eq = calculate_value_equation(b)
    ltv_cac = calculate_ltv_cac(b)
    constraints = identify_constraints(b)
    stage = determine_stage(b)
    verdict = generate_verdict(grader["score"])

    # Determine the ONE constraint to fix first
    critical = [c for c in constraints if c["severity"] == "Critical"]
    primary_constraint = critical[0]["constraint"] if critical else constraints[0]["constraint"]

    return {
        "hormozi_score": grader["score"],
        "verdict": verdict,
        "breakdown": grader["breakdown"],
        "value_equation": value_eq,
        "ltv_cac_analysis": ltv_cac,
        "constraints": constraints,
        "primary_constraint": primary_constraint,
        "stage": stage,
    }


def main():
    parser = argparse.ArgumentParser(description="Hormozi Business Grader")
    parser.add_argument("--input", type=str, help="JSON string of business inputs")
    args = parser.parse_args()

    if args.input:
        data = json.loads(args.input)
    else:
        data = json.loads(sys.stdin.read())

    result = run_full_assessment(data)
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
