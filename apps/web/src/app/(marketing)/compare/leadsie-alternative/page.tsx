/**
 * Leadsie Alternative Comparison Page
 * Target keyword: "Leadsie alternative"
 * Framework: AIDA (Attention → Interest → Desire → Action)
 */

import { Check, X, ArrowRight, Clock, DollarSign, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComparisonTable, ComparisonHeader, ComparisonSection, ComparisonRow } from "@/components/ui/comparison-table";
import Link from "next/link";
import { Metadata } from "next";
import type { Route } from "next";

export const metadata: Metadata = {
  title: "Leadsie Alternative | Why Agencies Switch to AuthHub",
  description: "Looking for a Leadsie alternative? AuthHub combines access + intake in one link, flat-rate pricing at $79/mo, and US-based support. See why agencies made the switch.",
  keywords: [
    "Leadsie alternative",
    "Leadsie vs AuthHub",
    "client access platform alternative",
    "agency onboarding software",
    "Leadsie pricing comparison",
    "Leadsie competitor",
  ],
  openGraph: {
    title: "Leadsie Alternative | Why Agencies Switch to AuthHub",
    description: "AuthHub combines platform access AND client intake in one professional link—at a predictable flat rate. See the full comparison.",
    type: "website",
  },
};

export default function LeadsieAlternativePage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero Section - AIDA: Attention */}
      <section className="border-b-2 border-black bg-coral/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-mono text-sm text-coral font-bold uppercase tracking-wider mb-4">
              Leadsie Alternative Comparison
            </p>
            <h1 className="font-dela text-4xl sm:text-5xl md:text-6xl text-ink mb-6 tracking-tight">
              Looking for a Leadsie Alternative?
            </h1>
            <p className="font-mono text-lg md:text-xl text-foreground mb-8 max-w-2xl mx-auto">
              Stop juggling separate tools for access and intake. Get both in one professional link—at a predictable flat rate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={"/sign-up" as Route}>
                <Button variant="brutalist" size="xl">
                  Start Free Trial — 21 Days
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#comparison">
                <Button variant="brutalist-ghost" size="xl">
                  See Full Comparison
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TL;DR Summary - AIDA: Interest */}
      <section className="border-b-2 border-black bg-ink text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-dela text-xl md:text-2xl mb-4 text-center">
              Why Agencies Switch to AuthHub
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="text-coral font-bold text-lg mb-2">Access + Intake</div>
                <p className="font-mono text-sm text-white/80">
                  One link handles OAuth <strong className="text-white">and</strong> collects client info—no separate forms needed.
                </p>
              </div>
              <div className="p-4">
                <div className="text-coral font-bold text-lg mb-2">Flat-Rate Pricing</div>
                <p className="font-mono text-sm text-white/80">
                  $79/mo unlimited. No credits, no surprises. <strong className="text-white">$240/year savings</strong> vs Leadsie Agency.
                </p>
              </div>
              <div className="p-4">
                <div className="text-coral font-bold text-lg mb-2">US-Based Support</div>
                <p className="font-mono text-sm text-white/80">
                  Same-day responses during US hours. No more 8-hour time zone delays.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Agencies Look for Alternatives - PAS Formula */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-4 text-center">
            Why Agencies Look for Leadsie Alternatives
          </h2>
          <p className="font-mono text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Growing agencies hit these walls with Leadsie. Sound familiar?
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Pain 1: Credit Anxiety */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 border-2 border-black rounded-none flex items-center justify-center">
                  <DollarSign size={20} className="text-red-600" />
                </div>
                <h3 className="font-dela text-lg text-ink">Credit Anxiety</h3>
              </div>
              <p className="font-mono text-sm text-foreground mb-3">
                <em>&ldquo;I never know what my bill will be.&rdquo;</em>
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                Usage-based pricing creates unpredictable costs. One busy month throws your budget. Growing agencies need predictable expenses.
              </p>
            </div>

            {/* Pain 2: Two-Step Onboarding */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 border-2 border-black rounded-none flex items-center justify-center">
                  <ArrowRight size={20} className="text-red-600" />
                </div>
                <h3 className="font-dela text-lg text-ink">Two-Step Onboarding</h3>
              </div>
              <p className="font-mono text-sm text-foreground mb-3">
                <em>&ldquo;I look unprofessional sending multiple links.&rdquo;</em>
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                Leadsie handles access. You still need Google Forms or Typeform for intake. Two links, two emails, two chances for clients to drop off.
              </p>
            </div>

            {/* Pain 3: UK Support Hours */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 border-2 border-black rounded-none flex items-center justify-center">
                  <Clock size={20} className="text-red-600" />
                </div>
                <h3 className="font-dela text-lg text-ink">UK Support Hours</h3>
              </div>
              <p className="font-mono text-sm text-foreground mb-3">
                <em>&ldquo;They&apos;re in the UK, I&apos;m in the US.&rdquo;</em>
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                8-hour time difference means next-day responses. When a client is locked out during your business hours, waiting isn&apos;t an option.
              </p>
            </div>

            {/* Pain 4: Limited Platforms */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 border-2 border-black rounded-none flex items-center justify-center">
                  <Globe size={20} className="text-red-600" />
                </div>
                <h3 className="font-dela text-lg text-ink">Missing Platforms</h3>
              </div>
              <p className="font-mono text-sm text-foreground mb-3">
                <em>&ldquo;They don&apos;t support Pinterest, Klaviyo, Shopify.&rdquo;</em>
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                E-commerce and email agencies need platforms beyond Meta and Google. Limited support means manual workarounds or turning away clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Differentiator: Access + Intake */}
      <section className="border-b-2 border-black bg-teal/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="font-mono text-sm text-teal font-bold uppercase tracking-wider mb-2">
                The AuthHub Difference
              </p>
              <h2 className="font-dela text-2xl md:text-4xl text-ink mb-4">
                Access + Intake in One Link
              </h2>
              <p className="font-mono text-muted-foreground max-w-2xl mx-auto">
                The #1 reason agencies switch: one professional link handles everything Leadsie does <strong>plus</strong> collects client information.
              </p>
            </div>

            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Before: Leadsie */}
              <div className="border-2 border-red-300 bg-red-50 p-6 rounded-none">
                <h3 className="font-dela text-lg text-red-700 mb-4 flex items-center gap-2">
                  <X size={20} />
                  With Leadsie: Two Steps
                </h3>
                <ol className="space-y-3 font-mono text-sm text-foreground">
                  <li className="flex gap-3">
                    <span className="bg-red-200 text-red-800 w-6 h-6 flex items-center justify-center rounded-sm flex-shrink-0 font-bold">1</span>
                    <span>Send Leadsie link for platform access</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-red-200 text-red-800 w-6 h-6 flex items-center justify-center rounded-sm flex-shrink-0 font-bold">2</span>
                    <span>Send Google Form/Typeform for intake</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-red-200 text-red-800 w-6 h-6 flex items-center justify-center rounded-sm flex-shrink-0 font-bold">3</span>
                    <span>Manually combine data from both sources</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-red-200 text-red-800 w-6 h-6 flex items-center justify-center rounded-sm flex-shrink-0 font-bold">4</span>
                    <span>Hope client completes both steps</span>
                  </li>
                </ol>
              </div>

              {/* After: AuthHub */}
              <div className="border-2 border-teal bg-white p-6 rounded-none shadow-brutalist">
                <h3 className="font-dela text-lg text-teal mb-4 flex items-center gap-2">
                  <Check size={20} />
                  With AuthHub: One Step
                </h3>
                <ol className="space-y-3 font-mono text-sm text-foreground">
                  <li className="flex gap-3">
                    <span className="bg-teal text-white w-6 h-6 flex items-center justify-center rounded-sm flex-shrink-0 font-bold">1</span>
                    <span>Send AuthHub link</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-teal text-white w-6 h-6 flex items-center justify-center rounded-sm flex-shrink-0 font-bold">2</span>
                    <span>Client authorizes platforms <strong>and</strong> fills intake form in one flow</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-teal text-white w-6 h-6 flex items-center justify-center rounded-sm flex-shrink-0 font-bold">3</span>
                    <span>All data arrives organized in your dashboard</span>
                  </li>
                  <li className="flex gap-3 opacity-0">
                    <span className="bg-teal text-white w-6 h-6 flex items-center justify-center rounded-sm flex-shrink-0 font-bold">4</span>
                    <span>&nbsp;</span>
                  </li>
                </ol>
                <p className="mt-4 font-mono text-sm text-teal font-bold">
                  Result: 5-minute onboarding, professional experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Comparison Table - AIDA: Interest */}
      <section id="comparison" className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
            Quick Comparison
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Leadsie */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="text-center mb-6">
                <h3 className="font-dela text-xl text-ink mb-2">Leadsie</h3>
                <div className="space-y-1">
                  <p className="font-mono text-2xl font-bold text-ink">
                    $99
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    $83/mo billed yearly ($990/yr)
                  </p>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-2">Agency tier</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>~8 platforms (Meta, Google, LinkedIn, TikTok)</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>Access-only (separate intake tool needed)</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>UK-based support (8hr time difference)</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>No Pinterest, Klaviyo, Shopify support</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>No reusable templates</span>
                </li>
              </ul>
            </div>

            {/* AuthHub - Winner */}
            <div className="border-[3px] border-black p-6 rounded-none shadow-brutalist-xl bg-teal/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-coral text-white px-4 py-1 text-xs font-bold uppercase tracking-wider border-2 border-black">
                Better Value
              </div>
              <div className="text-center mb-6 mt-2">
                <h3 className="font-dela text-xl text-ink mb-2">
                  AuthHub
                </h3>
                <div className="space-y-1">
                  <p className="font-mono text-2xl font-bold text-coral">
                    $79
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Flat-rate, unlimited clients
                  </p>
                </div>
                <p className="font-mono text-xs text-teal font-bold mt-2">Save $240/year</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span className="font-bold">15+ platforms (includes Pinterest, Klaviyo, Shopify)</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span className="font-bold">Access + Intake in one link</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span className="font-bold">US-based support, same-day response</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>Reusable onboarding templates</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span className="font-bold">API on all tiers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How AuthHub is Different - 4 Pillars */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-12 text-center">
            How AuthHub is Different
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pillar 1: Access + Intake */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-coral/20 border-2 border-black rounded-none flex items-center justify-center text-coral">
                  <Zap size={24} />
                </div>
                <h3 className="font-dela text-xl text-ink">
                  Access + Intake in One Link
                </h3>
              </div>
              <p className="font-mono text-sm text-foreground">
                <strong>The core differentiator.</strong> One professional link handles OAuth authorization AND collects client information. No juggling separate tools. No duplicate data entry. Your clients get a seamless experience, you get everything in one place.
              </p>
            </div>

            {/* Pillar 2: Flat-Rate Pricing */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-teal/20 border-2 border-black rounded-none flex items-center justify-center text-teal">
                  <DollarSign size={24} />
                </div>
                <h3 className="font-dela text-xl text-ink">
                  Flat-Rate Pricing
                </h3>
              </div>
              <p className="font-mono text-sm text-foreground">
                <strong>$79/mo unlimited.</strong> No credits to track. No surprise bills when you onboard 5 clients in a month. Predictable costs mean predictable margins. Save $240/year compared to Leadsie&apos;s Agency tier at $99/mo.
              </p>
            </div>

            {/* Pillar 3: US-Based Support */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple/20 border-2 border-black rounded-none flex items-center justify-center text-purple-600">
                  <Clock size={24} />
                </div>
                <h3 className="font-dela text-xl text-ink">
                  US-Based Support
                </h3>
              </div>
              <p className="font-mono text-sm text-foreground">
                <strong>Same-day responses during US business hours.</strong> When a client is locked out at 2pm EST, you need help now—not tomorrow. No 8-hour time zone gap. Real people who understand agency workflows.
              </p>
            </div>

            {/* Pillar 4: API on All Tiers */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-acid/20 border-2 border-black rounded-none flex items-center justify-center text-acid">
                  <Globe size={24} />
                </div>
                <h3 className="font-dela text-xl text-ink">
                  API on All Tiers
                </h3>
              </div>
              <p className="font-mono text-sm text-foreground">
                <strong>Build custom workflows without enterprise pricing.</strong> Connect AuthHub to your existing tools, automate client provisioning, or build internal dashboards. API access isn&apos;t locked behind a paywall.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature-by-Feature Comparison Table */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
            Feature-by-Feature Comparison
          </h2>
          <ComparisonTable>
            <ComparisonHeader />
            <tbody>
              {/* Platform Support Section */}
              <ComparisonSection title="Platform Support">
                <ComparisonRow
                  feature="Platform Count"
                  leadsie="~8"
                  authhub="15+"
                />
                <ComparisonRow
                  feature="Meta (Facebook, Instagram)"
                  leadsie={true}
                  authhub={true}
                />
                <ComparisonRow
                  feature="Google (Ads, GA4, GTM, etc.)"
                  leadsie="2"
                  authhub="8 products"
                />
                <ComparisonRow
                  feature="Pinterest Ads"
                  leadsie={false}
                  authhub={true}
                  exclusive
                />
                <ComparisonRow
                  feature="Klaviyo"
                  leadsie={false}
                  authhub={true}
                  exclusive
                />
                <ComparisonRow
                  feature="Shopify"
                  leadsie={false}
                  authhub={true}
                  exclusive
                />
              </ComparisonSection>

              {/* Core Features Section */}
              <ComparisonSection title="Core Features">
                <ComparisonRow
                  feature="Client Intake Forms"
                  leadsie={false}
                  authhub={true}
                  exclusive
                />
                <ComparisonRow
                  feature="Permission Levels"
                  leadsie="2-3 levels"
                  authhub="4 levels"
                />
                <ComparisonRow
                  feature="Reusable Templates"
                  leadsie={false}
                  authhub={true}
                />
                <ComparisonRow
                  feature="API Access"
                  leadsie={false}
                  authhub={true}
                />
                <ComparisonRow
                  feature="Token Storage"
                  leadsie="Database"
                  authhub="Infisical (Enterprise-grade)"
                />
              </ComparisonSection>

              {/* Support & Pricing Section */}
              <ComparisonSection title="Support & Pricing">
                <ComparisonRow
                  feature="Support Hours"
                  leadsie="UK (GMT)"
                  authhub="US (EST/PST)"
                />
                <ComparisonRow
                  feature="Starting Price"
                  leadsie="$99/mo"
                  authhub="$79/mo"
                />
              </ComparisonSection>
            </tbody>
          </ComparisonTable>
        </div>
      </section>

      {/* Who Should Switch (and Who Shouldn't) */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-12 text-center">
            Who Should Switch (and Who Shouldn&apos;t)
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Stick with Leadsie */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <h3 className="font-dela text-xl text-ink mb-4">Stick with Leadsie If</h3>
              <ul className="space-y-2 font-mono text-sm text-foreground">
                <li>• You only need Meta + Google access</li>
                <li>• You&apos;re UK-based and don&apos;t need US support hours</li>
                <li>• You have fewer than 20 clients</li>
                <li>• You already have a separate intake process that works</li>
                <li>• Enterprise security isn&apos;t a priority</li>
              </ul>
            </div>

            {/* Switch to AuthHub */}
            <div className="border-[3px] border-coral p-6 rounded-none shadow-brutalist-xl bg-coral/5">
              <h3 className="font-dela text-xl text-coral mb-4">
                Switch to AuthHub If
              </h3>
              <ul className="space-y-2 font-mono text-sm text-foreground">
                <li>• You need Pinterest, Klaviyo, or Shopify access</li>
                <li>• You&apos;re tired of sending multiple links for onboarding</li>
                <li>• You&apos;re US-based and want same-day support</li>
                <li>• You want predictable, flat-rate pricing</li>
                <li>• You have 20+ clients or plan to scale</li>
                <li>• You need reusable onboarding templates</li>
                <li>• Enterprise-grade security is required</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Migration Support */}
      <section className="border-b-2 border-black bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-dela text-2xl md:text-3xl text-ink mb-4">
              Switch in 15 Minutes
            </h2>
            <p className="font-mono text-muted-foreground mb-10">
              Moving from Leadsie is straightforward. Here&apos;s how agencies do it:
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-card border-2 border-black p-5 rounded-none">
                <div className="w-8 h-8 bg-coral text-white font-bold flex items-center justify-center rounded-sm mb-3">
                  1
                </div>
                <h3 className="font-dela text-ink mb-2">Export from Leadsie</h3>
                <p className="font-mono text-sm text-muted-foreground">
                  Download your existing connections and client data from Leadsie&apos;s dashboard.
                </p>
              </div>

              <div className="bg-card border-2 border-black p-5 rounded-none">
                <div className="w-8 h-8 bg-coral text-white font-bold flex items-center justify-center rounded-sm mb-3">
                  2
                </div>
                <h3 className="font-dela text-ink mb-2">Create Your Templates</h3>
                <p className="font-mono text-sm text-muted-foreground">
                  Set up reusable templates in AuthHub for your common client types (e-commerce, lead gen, etc.).
                </p>
              </div>

              <div className="bg-card border-2 border-black p-5 rounded-none">
                <div className="w-8 h-8 bg-coral text-white font-bold flex items-center justify-center rounded-sm mb-3">
                  3
                </div>
                <h3 className="font-dela text-ink mb-2">Send New Links</h3>
                <p className="font-mono text-sm text-muted-foreground">
                  Send AuthHub links to active clients. Existing connections stay live until they re-authorize.
                </p>
              </div>
            </div>

            <p className="font-mono text-sm text-muted-foreground mt-8">
              Need help? Our support team walks you through migration during onboarding.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA - AIDA: Action */}
      <section className="bg-ink text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-dela text-3xl md:text-4xl mb-4">
            Ready to Streamline Your Onboarding?
          </h2>
          <p className="font-mono text-white/80 mb-8 max-w-xl mx-auto">
            Start your 21-day free trial—the longest in the industry. No credit card required.
            See why agencies switched from Leadsie to AuthHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={"/sign-up" as Route}>
              <Button variant="brutalist-rounded" size="xl">
                Start Free Trial — 21 Days
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="brutalist-ghost-rounded" size="xl">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-6">
            ✓ Access + Intake in one link &nbsp; ✓ $79/mo flat rate &nbsp; ✓ US-based support
          </p>
        </div>
      </section>
    </div>
  );
}
