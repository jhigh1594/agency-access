/**
 * Comparison Page Template
 * Clean, modern comparison page design for SEO and conversions
 * Supports head-to-head feature comparison, differentiators, pricing, and FAQs
 */

"use client";

import { useState } from "react";
import { Check, X, ChevronDown, Sparkles, Shield, Code, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ProgrammaticComparisonPage } from "@/lib/programmatic-types";

interface ComparisonPageTemplateProps {
  page: ProgrammaticComparisonPage;
}

// Differentiator content for the key differentiators section
const DIFFERENTIATOR_CONTENT = {
  "Automatic Token Refresh": {
    authhub: "AuthHub automatically monitors token health and refreshes credentials before they expire. This happens in the background with zero client involvement, ensuring 99.9% uptime for your connected accounts.",
    competitor: "{competitor} uses official platform APIs but doesn't advertise automatic token refresh. When tokens expire, clients need to manually reconnect, which can interrupt live campaigns.",
    whyMatters: "Never lose access mid-campaign. AuthHub's auto-refresh eliminates the 'token expired' support tickets that plague agencies using manual reconnection workflows.",
    icon: Sparkles,
  },
  "Enterprise Security & Compliance": {
    authhub: "SOC 2 Type II certified with bank-grade token encryption through Infisical. Complete audit logs track who accessed what and when for internal accountability and compliance requirements.",
    competitor: "{competitor} is GDPR compliant and secure by design using official platform APIs. No passwords are stored. No public SOC 2 certification or detailed audit log functionality advertised.",
    whyMatters: "Agencies with enterprise clients or regulated industries benefit from AuthHub's SOC 2 certification and complete audit trails for compliance documentation.",
    icon: Shield,
  },
  "Developer-Friendly Automation": {
    authhub: "Webhooks and API access included on paid tiers with live OAuth event telemetry. Build internal workflows, data pipelines, and custom automation beyond pre-built connectors.",
    competitor: "{competitor} offers Zapier integration on Premium plans ($74+/mo) for connecting to other tools. No public API advertised for custom development or advanced automation.",
    whyMatters: "Automation-heavy teams building internal workflows get deeper control and flexibility with API/webhooks versus being limited to Zapier-only integrations.",
    icon: Code,
  },
  "SOC 2 Type II Certified": {
    authhub: "SOC 2 Type II certified with bank-grade token encryption through Infisical. Complete audit logs track who accessed what and when for internal accountability and compliance requirements.",
    competitor: "{competitor} is GDPR compliant and secure by design using official platform APIs. No passwords are stored. No public SOC 2 certification or detailed audit log functionality advertised.",
    whyMatters: "Agencies with enterprise clients or regulated industries benefit from AuthHub's SOC 2 certification and complete audit trails for compliance documentation.",
    icon: Shield,
  },
  "API & Webhooks Built-In": {
    authhub: "Webhooks and API access included on paid tiers with live OAuth event telemetry. Build internal workflows, data pipelines, and custom automation beyond pre-built connectors.",
    competitor: "{competitor} offers Zapier integration on Premium plans ($74+/mo) for connecting to other tools. No public API advertised for custom development or advanced automation.",
    whyMatters: "Automation-heavy teams building internal workflows get deeper control and flexibility with API/webhooks versus being limited to Zapier-only integrations.",
    icon: Code,
  },
};

export function ComparisonPageTemplate({ page }: ComparisonPageTemplateProps) {
  const { competitor, ourProduct, cta, quickComparison, recommendations, faqs } = page;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Get the three differentiators for this page
  const differentiators = ourProduct.differentiators.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
              2026 Comparison Guide
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              {ourProduct.name} vs {competitor.name}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {page.excerpt}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={(cta.primaryLink || "/signup") as Route}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                START FREE TRIAL
                <ExternalLink size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                SCHEDULE DEMO
              </Link>
            </div>
            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-500" />
                <span>14-DAY FREE TRIAL</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-500" />
                <span>NO CREDIT CARD</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-500" />
                <span>CANCEL ANYTIME</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section id="comparison" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              Feature Comparison
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Head-to-Head Comparison
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A detailed look at how {ourProduct.name} and {competitor.name} stack up on features, security, and pricing.
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    {ourProduct.name}
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {competitor.name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quickComparison.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {row.feature}
                    </td>
                    <td className={`px-4 py-4 text-sm text-center ${row.winner === "authhub" ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                      {formatValue(row.authhub, row.winner === "authhub")}
                    </td>
                    <td className={`px-4 py-4 text-sm text-center ${row.winner === "competitor" ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                      {formatValue(row.competitor, row.winner === "competitor")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              Key Differentiators
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Where {ourProduct.name} Stands Out
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Three critical areas where {ourProduct.name} delivers better value for agencies that need reliability, security, and automation.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {differentiators.map((diff, index) => {
              const content = DIFFERENTIATOR_CONTENT[diff as keyof typeof DIFFERENTIATOR_CONTENT] || {
                authhub: `${ourProduct.name} excels in this area.`,
                competitor: `${competitor.name} has limited capabilities here.`,
                whyMatters: "This can significantly impact your agency's efficiency.",
                icon: Sparkles,
              };
              const IconComponent = content.icon;

              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent size={20} className="text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{diff}</h3>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-500 uppercase">{ourProduct.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {content.authhub}
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-500 uppercase">{competitor.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {content.competitor.replace("{competitor}", competitor.name)}
                      </p>
                    </div>
                    <div className="p-6 bg-blue-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-600 uppercase">Why it matters</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {content.whyMatters}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cost Comparison
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Compare equivalent feature sets and see where you get the most value for your budget.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
            {/* AuthHub Card */}
            <div className="relative bg-white rounded-xl border-2 border-blue-600 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider py-2 text-center">
                Best Value
              </div>
              <div className="p-6 pt-12">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{ourProduct.name} Growth</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${ourProduct.pricing.starter?.price || ourProduct.pricing.starting}</span>
                  <span className="text-gray-500 ml-2">per month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {ourProduct.pricing.starter?.features?.slice(0, 7).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={(cta.primaryLink || "/signup") as Route}
                  className="block w-full py-3 bg-blue-600 text-white font-semibold text-center rounded-lg hover:bg-blue-700 transition-colors"
                >
                  START FREE TRIAL
                </Link>
              </div>
            </div>

            {/* Competitor Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{competitor.name} Premium</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${competitor.pricing.pro?.price || competitor.pricing.starting}</span>
                  <span className="text-gray-500 ml-2">per month {competitor.pricing.billing === "yearly" ? "(annual)" : ""}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {competitor.pricing.pro?.features?.slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-gray-100 text-gray-700 font-semibold text-center rounded-lg hover:bg-gray-200 transition-colors"
                >
                  VISIT WEBSITE
                </a>
              </div>
            </div>
          </div>

          {/* Value Summary */}
          <div className="max-w-4xl mx-auto bg-blue-50 rounded-xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Value Summary</h4>
              <p className="text-sm text-gray-600">
                For agencies needing unlimited clients, API access, and automatic token refresh, {ourProduct.name} Growth (${ourProduct.pricing.starting}/mo) delivers more automation than {competitor.name} Premium (${competitor.pricing.pro?.price}/mo). Save over $500/year while gaining enterprise security and developer tools. {competitor.name} excels with broader platform coverage and 24/7 chat support on higher tiers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Choose Which */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              Right Fit
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Who Should Choose Which?
            </h2>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* AuthHub */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">{ourProduct.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{ourProduct.name}</h3>
                  <p className="text-sm text-gray-500">Best for automation-focused agencies</p>
                </div>
              </div>
              <ul className="space-y-3">
                {recommendations.switchToAuthHub.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Competitor */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">{competitor.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{competitor.name}</h3>
                  <p className="text-sm text-gray-500">Best for broad platform coverage</p>
                </div>
              </div>
              <ul className="space-y-3">
                {recommendations.stickWithCompetitor.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Common questions about switching from {competitor.name} to {ourProduct.name}.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {cta.headline}
            </h2>
            <p className="text-blue-100 mb-8">
              {cta.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={(cta.primaryLink || "/signup") as Route}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                START 14-DAY FREE TRIAL
                <ExternalLink size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors"
              >
                SCHEDULE A DEMO
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-300" />
                <span>NO CREDIT CARD REQUIRED</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-300" />
                <span>UNLIMITED CLIENTS</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-300" />
                <span>CANCEL ANYTIME</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helper function to format comparison values
function formatValue(value: boolean | string, isWinner: boolean): React.ReactNode {
  if (typeof value === "boolean") {
    if (value) {
      return <Check size={18} className="text-green-500 mx-auto" />;
    }
    return <X size={18} className="text-red-400 mx-auto" />;
  }
  return <span className={isWinner ? "font-semibold" : ""}>{value}</span>;
}

export default ComparisonPageTemplate;
