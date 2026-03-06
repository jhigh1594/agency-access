/**
 * Programmatic Comparison Page Template
 * AIDA/PAS framework-based comparison page component for SEO and conversions
 * Designed for programmatic generation with data-driven content
 */

"use client";

import { Check, X, ArrowRight, Clock, DollarSign, Globe, Zap, Shield, Users } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ProgrammaticComparisonPage } from "@/lib/programmatic-types";

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Clock,
  DollarSign,
  Globe,
  Zap,
  Shield,
  Users,
  ArrowRight,
};

interface ComparisonPageTemplateProps {
  page: ProgrammaticComparisonPage;
}

/**
 * Main comparison page template component
 * Renders the full comparison page with all sections
 */
export function ComparisonPageTemplate({ page }: ComparisonPageTemplateProps) {
  const { competitor, ourProduct, cta, testimonials, painPoints, quickComparison, detailedComparison, recommendations, migrationSteps, pricingComparison, faqs } = page;

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero Section - AIDA: Attention */}
      <section className="border-b-2 border-black bg-coral/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-mono text-sm text-coral font-bold uppercase tracking-wider mb-4">
              {competitor.name} Alternative Comparison
            </p>
            <h1 className="font-dela text-4xl sm:text-5xl md:text-6xl text-ink mb-6 tracking-tight">
              Looking for a {competitor.name} Alternative?
            </h1>
            <p className="font-mono text-lg md:text-xl text-foreground mb-8 max-w-2xl mx-auto">
              {page.excerpt}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={(cta.primaryLink || "/signup") as Route}
                className="inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider px-8 py-4 bg-ink text-white border-2 border-black shadow-brutalist hover:shadow-brutalist-lg hover:-translate-y-0.5 transition-all"
              >
                {cta.primaryButton}
              </Link>
              <Link
                href="#comparison"
                className="inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider px-8 py-4 bg-transparent text-ink border-2 border-black hover:bg-ink hover:text-white transition-all"
              >
                See Full Comparison
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
              Why Agencies Switch to {ourProduct.name}
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              {ourProduct.differentiators.slice(0, 3).map((diff, i) => (
                <div key={i} className="p-4">
                  <div className="text-coral font-bold text-lg mb-2">{diff}</div>
                  <p className="font-mono text-sm text-white/80">
                    {getDifferentiatorDescription(diff)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Agencies Look for Alternatives - PAS Formula */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-4 text-center">
            Why Agencies Look for {competitor.name} Alternatives
          </h2>
          <p className="font-mono text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Growing agencies hit these walls with {competitor.name}. Sound familiar?
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {painPoints.map((pain, index) => {
              const IconComponent = iconMap[pain.icon] || ArrowRight;
              return (
                <div key={index} className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-destructive/10 border-2 border-black rounded-none flex items-center justify-center">
                      <IconComponent size={20} className="text-destructive" />
                    </div>
                    <h3 className="font-dela text-lg text-ink">{pain.title}</h3>
                  </div>
                  <p className="font-mono text-sm text-foreground mb-3">
                    <em>&ldquo;{pain.quote}&rdquo;</em>
                  </p>
                  <p className="font-mono text-sm text-muted-foreground">
                    {pain.description}
                  </p>
                </div>
              );
            })}
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
            {/* Competitor Card */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="text-center mb-6">
                <h3 className="font-dela text-xl text-ink mb-2">{competitor.name}</h3>
                <div className="space-y-1">
                  <p className="font-mono text-2xl font-bold text-ink">
                    ${competitor.pricing.starting}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  {competitor.pricing.billing === "yearly" && (
                    <p className="font-mono text-xs text-muted-foreground">
                      Billed yearly
                    </p>
                  )}
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {quickComparison.slice(0, 5).map((row, i) => (
                  <li key={i} className="flex items-start gap-2 font-mono text-sm">
                    {typeof row.competitor === "boolean" ? (
                      row.competitor ? (
                        <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                      ) : (
                        <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                      )
                    ) : (
                      <span className="w-4 text-center">{row.competitor}</span>
                    )}
                    <span>{row.feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AuthHub Card - Winner */}
            <div className="border-[3px] border-black p-6 rounded-none shadow-brutalist-xl bg-teal/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-coral text-white px-4 py-1 text-xs font-bold uppercase tracking-wider border-2 border-black">
                Better Value
              </div>
              <div className="text-center mb-6 mt-2">
                <h3 className="font-dela text-xl text-ink mb-2">{ourProduct.name}</h3>
                <div className="space-y-1">
                  <p className="font-mono text-2xl font-bold text-coral">
                    ${ourProduct.pricing.starting}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Flat-rate, unlimited clients
                  </p>
                </div>
                {pricingComparison.savings.yearly > 0 && (
                  <p className="font-mono text-xs text-teal font-bold mt-2">
                    Save ${pricingComparison.savings.yearly}/year
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {quickComparison.slice(0, 5).map((row, i) => (
                  <li key={i} className="flex items-start gap-2 font-mono text-sm">
                    {typeof row.authhub === "boolean" ? (
                      row.authhub ? (
                        <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                      ) : (
                        <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                      )
                    ) : (
                      <span className="w-4 text-center font-bold">{row.authhub}</span>
                    )}
                    <span className={row.isExclusive ? "font-bold" : ""}>{row.feature}</span>
                    {row.isExclusive && (
                      <span className="text-xs text-coral font-bold">(Exclusive)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature-by-Feature Comparison */}
      {detailedComparison.length > 0 && (
        <section className="border-b-2 border-black bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
              Feature-by-Feature Comparison
            </h2>
            <div className="max-w-4xl mx-auto overflow-x-auto">
              {detailedComparison.map((category, catIndex) => (
                <div key={catIndex} className="mb-8">
                  <h3 className="font-dela text-lg text-ink mb-4 border-l-4 border-coral pl-4">
                    {category.category}
                  </h3>
                  <table className="w-full border-2 border-black text-sm font-mono">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-black">
                        <th className="px-4 py-3 text-left font-bold text-ink border-r border-black">Feature</th>
                        <th className="px-4 py-3 text-center font-bold text-ink border-r border-black">{competitor.name}</th>
                        <th className="px-4 py-3 text-center font-bold text-ink">{ourProduct.name}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-black">
                      {category.features.map((feature, featIndex) => (
                        <tr key={featIndex} className="border-b border-gray-300">
                          <td className="px-4 py-3 text-ink border-r border-gray-300">{feature.name}</td>
                          <td className="px-4 py-3 text-center border-r border-gray-300">
                            {typeof feature.competitor === "boolean" ? (
                              feature.competitor ? (
                                <Check size={16} className="text-teal mx-auto" />
                              ) : (
                                <X size={16} className="text-red mx-auto" />
                              )
                            ) : (
                              feature.competitor
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {typeof feature.authhub === "boolean" ? (
                              feature.authhub ? (
                                <Check size={16} className="text-teal mx-auto" />
                              ) : (
                                <X size={16} className="text-red mx-auto" />
                              )
                            ) : (
                              <span className="font-bold">{feature.authhub}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Who Should Switch (and Who Shouldn't) */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-12 text-center">
            Who Should Switch (and Who Shouldn&apos;t)
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Stick with competitor */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <h3 className="font-dela text-xl text-ink mb-4">Stick with {competitor.name} If</h3>
              <ul className="space-y-2 font-mono text-sm text-foreground">
                {recommendations.stickWithCompetitor.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>

            {/* Switch to AuthHub */}
            <div className="border-[3px] border-coral p-6 rounded-none shadow-brutalist-xl bg-coral/5">
              <h3 className="font-dela text-xl text-coral mb-4">
                Switch to {ourProduct.name} If
              </h3>
              <ul className="space-y-2 font-mono text-sm text-foreground">
                {recommendations.switchToAuthHub.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Migration Steps */}
      {migrationSteps.length > 0 && (
        <section className="border-b-2 border-ink bg-teal/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-dela text-3xl md:text-4xl text-ink mb-4">
                Switch in {page.migrationTimeMinutes || 15} Minutes
              </h2>
              <p className="font-mono text-muted-foreground mb-12">
                Moving from {competitor.name} is straightforward. Here&apos;s how agencies do it:
              </p>

              <div className="grid md:grid-cols-3 gap-6 md:gap-8 text-left">
                {migrationSteps.map((step) => (
                  <div key={step.step} className="bg-paper border-2 border-ink p-6 shadow-brutalist hover-lift-brutalist group">
                    <div className="w-12 h-12 bg-coral text-white font-display font-bold text-xl flex items-center justify-center shadow-brutalist-sm mb-4">
                      {step.step}
                    </div>
                    <h3 className="font-display font-semibold text-ink text-lg mb-2">{step.title}</h3>
                    <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-4 bg-ink/5 border border-ink/10 inline-flex items-center gap-3">
                <div className="w-8 h-8 bg-teal/20 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-teal" />
                </div>
                <p className="font-mono text-sm text-ink/80">
                  <span className="font-semibold">Free migration support:</span> Our team walks you through the switch during onboarding.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-b-2 border-black bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
              What Agencies Say
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {testimonials.slice(0, 2).map((testimonial, i) => (
                <div key={i} className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
                  <blockquote className="font-mono text-ink mb-4">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center">
                      <span className="font-bold text-coral">{testimonial.author[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-ink text-sm">{testimonial.author}</p>
                      <p className="text-muted-foreground text-xs font-mono">
                        {testimonial.role} at {testimonial.company}
                        {testimonial.previousTool && (
                          <span className="text-coral"> • {testimonial.previousTool}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="border-b-2 border-black bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group border-2 border-black p-4 rounded-none">
                  <summary className="font-dela text-lg text-ink cursor-pointer list-none flex justify-between items-center">
                    {faq.question}
                    <span className="transform transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <p className="font-mono text-sm text-foreground mt-4 pt-4 border-t border-gray-200">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA - AIDA: Action */}
      <section className="bg-ink text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-dela text-3xl md:text-4xl mb-4">
            {cta.headline}
          </h2>
          <p className="font-mono text-white/80 mb-8 max-w-xl mx-auto">
            {cta.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={(cta.primaryLink ?? "/signup") as Route}
              className="inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider px-8 py-4 bg-coral text-white border-2 border-white rounded-none shadow-brutalist hover:shadow-brutalist-lg hover:-translate-y-0.5 transition-all"
            >
              {cta.primaryButton}
            </Link>
            {cta.secondaryButton && (
              <Link
                href={(cta.secondaryLink ?? "/pricing") as Route}
                className="inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider px-8 py-4 bg-transparent text-white border-2 border-white hover:bg-white hover:text-ink transition-all"
              >
                {cta.secondaryButton}
              </Link>
            )}
          </div>
          {cta.guarantee && (
            <p className="font-mono text-xs text-muted-foreground mt-6">
              {cta.guarantee}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// Helper function to get differentiator descriptions
function getDifferentiatorDescription(differentiator: string): string {
  const descriptions: Record<string, string> = {
    "Access + Intake": "One link handles OAuth and collects client info—no separate forms needed.",
    "Flat-Rate Pricing": "No credits, no surprises. Predictable costs mean predictable margins.",
    "US-Based Support": "Same-day responses during US hours. No more time zone delays.",
    "15+ Platforms": "Support for Pinterest, Klaviyo, Shopify, and more emerging channels.",
    "Enterprise Security": "Infisical token storage with audit logs for SOC2 compliance.",
  };

  return descriptions[differentiator] || "Industry-leading capability that sets us apart.";
}

export default ComparisonPageTemplate;
