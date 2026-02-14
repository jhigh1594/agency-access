/**
 * Comparison page: Leadsie vs Other Platforms vs AuthHub
 * A dedicated route for bottom-of-funnel comparison content
 */

import { Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Leadsie vs Other Platforms vs AuthHub: 2024 Comparison",
  description:
    "Comprehensive comparison of the three leading client access platforms. See how platform support, security, permissions, and pricing differ.",
  keywords: [
    "Leadsie alternative",
    "client access alternatives",
    "client access platform",
    "agency tools comparison",
  ],
  openGraph: {
    title:
      "Leadsie vs Other Platforms vs AuthHub: 2024 Comparison",
    description:
      "Comprehensive comparison of client access platforms for marketing agencies.",
    type: "website",
  },
};

export default function ComparisonPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero section */}
      <section className="border-b-2 border-black bg-coral/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-dela text-4xl sm:text-5xl md:text-6xl text-ink mb-6 tracking-tight">
              3 Platforms.
              <br />
              <span className="text-coral">1 Clear Winner.</span>
            </h1>
            <p className="font-mono text-lg md:text-xl text-gray-700 mb-8">
              Comprehensive comparison of Leadsie, other platforms, and AuthHub.
              See features, pricing, and capabilities
              side-by-side.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="brutalist" size="xl">
                Start Free Trial - 21 Days
              </Button>
              <Button variant="brutalist-ghost" size="xl">
                View All Comparisons
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick summary */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
            Quick Comparison
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Leadsie */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="text-center mb-6">
                <h3 className="font-dela text-xl text-ink mb-2">Leadsie</h3>
                <p className="font-mono text-2xl font-bold text-ink">
                  $97
                  <span className="text-sm font-normal text-gray-600">
                    /month
                  </span>
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>~8 platforms</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>2-3 permission levels</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>No templates</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>Database token storage</span>
                </li>
              </ul>
            </div>

            {/* Other Platforms */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="text-center mb-6">
                <h3 className="font-dela text-xl text-ink mb-2">
                  Other Platforms
                </h3>
                <p className="font-mono text-2xl font-bold text-ink">
                  $149
                  <span className="text-sm font-normal text-gray-600">
                    /month
                  </span>
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>~10 platforms</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>2 permission levels</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>No templates</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>Database token storage</span>
                </li>
              </ul>
            </div>

            {/* AuthHub - Winner */}
            <div className="border-[3px] border-black p-6 rounded-none shadow-hard-xl bg-teal/10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-coral text-white px-4 py-1 text-xs font-bold uppercase tracking-wider border-2 border-black">
                Winner
              </div>
              <div className="text-center mb-6 mt-2">
                <h3 className="font-dela text-xl text-ink mb-2">
                  AuthHub
                </h3>
                <p className="font-mono text-2xl font-bold text-coral">
                  $79
                  <span className="text-sm font-normal text-gray-600">
                    /month
                  </span>
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span className="font-bold">15+ platforms</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span className="font-bold">4 permission levels</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>Reusable templates</span>
                </li>
                <li className="flex items-start gap-2 font-mono text-sm">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span className="font-bold">Infisical security</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed feature comparison table */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto border-2 border-black rounded-none">
            <table className="w-full text-sm">
              <thead className="bg-ink text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-bold border-r border-white">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-center font-bold border-r border-white">
                    Leadsie
                  </th>
                  <th className="px-4 py-3 text-center font-bold border-r border-white">
                    Other Platforms
                  </th>
                  <th className="px-4 py-3 text-center font-bold">
                    AuthHub
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Platform Support */}
                <tr className="border-t border-black bg-gray-50">
                  <td className="px-4 py-3 font-bold border-r border-black">
                    Platform Count
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    ~8
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    ~10
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-teal">
                    15+
                  </td>
                </tr>
                {/* Meta */}
                <tr className="border-t border-black">
                  <td className="px-4 py-3 border-r border-black pl-6">
                    Meta (Facebook, Instagram)
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <Check className="inline text-teal" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <Check className="inline text-teal" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="inline text-teal" size={16} />
                  </td>
                </tr>
                {/* Google */}
                <tr className="border-t border-black bg-gray-50">
                  <td className="px-4 py-3 border-r border-black pl-6">
                    Google (Ads, GA4, GTM, etc.)
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <Check className="inline text-teal" size={16} />
                    <span className="text-xs text-gray-500 ml-1">(2)</span>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <Check className="inline text-teal" size={16} />
                    <span className="text-xs text-gray-500 ml-1">(2)</span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-teal">
                    <Check className="inline" size={16} />
                    <span className="text-xs ml-1">(8 products)</span>
                  </td>
                </tr>
                {/* Pinterest */}
                <tr className="border-t border-black">
                  <td className="px-4 py-3 border-r border-black pl-6">
                    Pinterest Ads
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="inline text-teal" size={16} />
                  </td>
                </tr>
                {/* Klaviyo */}
                <tr className="border-t border-black bg-gray-50">
                  <td className="px-4 py-3 border-r border-black pl-6">
                    Klaviyo
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="inline text-teal" size={16} />
                  </td>
                </tr>
                {/* Shopify */}
                <tr className="border-t border-black">
                  <td className="px-4 py-3 border-r border-black pl-6">Shopify</td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="inline text-teal" size={16} />
                  </td>
                </tr>
                {/* Permission Levels */}
                <tr className="border-t border-black bg-gray-50">
                  <td className="px-4 py-3 font-bold border-r border-black">
                    Permission Levels
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    2-3 levels
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    2 levels
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-teal">
                    4 levels
                  </td>
                </tr>
                {/* Token Storage */}
                <tr className="border-t border-black">
                  <td className="px-4 py-3 font-bold border-r border-black">
                    Token Storage
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    Database
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    Database
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-teal">
                    Infisical
                  </td>
                </tr>
                {/* Templates */}
                <tr className="border-t border-black bg-gray-50">
                  <td className="px-4 py-3 font-bold border-r border-black">
                    Onboarding Templates
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="inline text-teal" size={16} />
                  </td>
                </tr>
                {/* Custom Branding */}
                <tr className="border-t border-black">
                  <td className="px-4 py-3 font-bold border-r border-black">
                    Custom Branding
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    <X className="inline text-red" size={16} />
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    Limited
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="inline text-teal" size={16} />
                    <span className="text-xs ml-1">(full)</span>
                  </td>
                </tr>
                {/* Pricing */}
                <tr className="border-t border-black bg-gray-50">
                  <td className="px-4 py-3 font-bold border-r border-black">
                    Starting Price
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    $97/mo
                  </td>
                  <td className="px-4 py-3 text-center border-r border-black">
                    $149/mo
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-coral">
                    $79/mo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why AuthHub wins */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-12 text-center">
            Why AuthHub Wins
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Platform Advantage */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-coral/20 border-2 border-black rounded-none flex items-center justify-center text-coral">
                  🎯
                </div>
                <h3 className="font-dela text-xl text-ink">
                  5+ More Platforms
                </h3>
              </div>
              <p className="font-mono text-sm text-gray-700">
                Pinterest, Klaviyo, Shopify, Kit, Beehiiv—competitors don't
                support these essential platforms. E-commerce and email agencies
                need these channels.
              </p>
            </div>

            {/* Security Advantage */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-teal/20 border-2 border-black rounded-none flex items-center justify-center text-teal">
                  🔒
                </div>
                <h3 className="font-dela text-xl text-ink">
                  Enterprise Security
                </h3>
              </div>
              <p className="font-mono text-sm text-gray-700">
                Infisical token storage vs. database encryption. SOC2-ready audit
                logs. Fortune 500 security standards at startup pricing.
              </p>
            </div>

            {/* Templates Advantage */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-acid/20 border-2 border-black rounded-none flex items-center justify-center text-acid">
                  ⚡
                </div>
                <h3 className="font-dela text-xl text-ink">
                  Reusable Templates
                </h3>
              </div>
              <p className="font-mono text-sm text-gray-700">
                Create "E-commerce Client" templates once, apply to every new
                client. Scale from 10 to 100 clients without recreating access
                requests.
              </p>
            </div>

            {/* Price Advantage */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple/20 border-2 border-black rounded-none flex items-center justify-center text-purple">
                  💰
                </div>
                <h3 className="font-dela text-xl text-ink">Best Price</h3>
              </div>
              <p className="font-mono text-sm text-gray-700">
                $79/mo vs $97-149/mo. More features, more platforms, better
                security—at $18-70 less per month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform-by-platform breakdown */}
      <section className="border-b-2 border-black bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
            Platform Support Breakdown
          </h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                name: "Meta (Facebook, Instagram, WhatsApp)",
                leadsie: true,
                otherPlatforms: true,
                authHub: true,
              },
              {
                name: "Google (Ads, GA4, GTM, Merchant Center, Search Console)",
                leadsie: true,
                otherPlatforms: true,
                authHub: true,
                note: "AuthHub: 8 products from 1 OAuth",
              },
              {
                name: "LinkedIn Ads",
                leadsie: true,
                otherPlatforms: true,
                authHub: true,
              },
              {
                name: "TikTok Ads",
                leadsie: true,
                otherPlatforms: true,
                authHub: true,
              },
              {
                name: "Pinterest Ads",
                leadsie: false,
                otherPlatforms: false,
                authHub: true,
                exclusive: true,
              },
              {
                name: "Klaviyo",
                leadsie: false,
                otherPlatforms: false,
                authHub: true,
                exclusive: true,
              },
              {
                name: "Shopify",
                leadsie: false,
                otherPlatforms: false,
                authHub: true,
                exclusive: true,
              },
              {
                name: "Kit",
                leadsie: false,
                otherPlatforms: false,
                authHub: true,
                exclusive: true,
              },
              {
                name: "Beehiiv",
                leadsie: false,
                otherPlatforms: false,
                authHub: true,
                exclusive: true,
              },
            ].map((platform) => (
              <div
                key={platform.name}
                className={`border-2 rounded-none p-4 flex items-center justify-between ${
                  platform.exclusive
                    ? "bg-teal/10 border-teal"
                    : "border-black bg-card"
                }`}
              >
                <div className="flex-1">
                  <span className="font-mono font-bold text-ink">
                    {platform.name}
                  </span>
                  {platform.note && (
                    <span className="ml-2 text-xs text-teal font-bold">
                      ({platform.note})
                    </span>
                  )}
                  {platform.exclusive && (
                    <span className="ml-2 px-2 py-0.5 bg-teal text-white text-xs font-bold uppercase rounded-sm">
                      Only AuthHub
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono text-sm text-gray-600">
                    Leadsie:{" "}
                    {platform.leadsie ? (
                      <Check className="inline text-teal" size={16} />
                    ) : (
                      <X className="inline text-red" size={16} />
                    )}
                  </span>
                  <span className="font-mono text-sm text-gray-600">
                    Other Platforms:{" "}
                    {platform.otherPlatforms ? (
                      <Check className="inline text-teal" size={16} />
                    ) : (
                      <X className="inline text-red" size={16} />
                    )}
                  </span>
                  <span className="font-mono text-sm font-bold text-ink">
                    AuthHub:{" "}
                    {platform.authHub ? (
                      <Check className="inline text-teal" size={16} />
                    ) : (
                      <X className="inline text-red" size={16} />
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security comparison */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-8 text-center">
            Security Matters: Database vs. Infisical
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Database storage (competitors) */}
            <div className="border-2 border-red-300 bg-red-50 p-6 rounded-none">
              <h3 className="font-dela text-xl text-red-700 mb-4 flex items-center gap-2">
                <AlertCircle size={20} />
                Database Storage (Competitors)
              </h3>
              <ul className="space-y-2 font-mono text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>Tokens in database = breach exposes all clients</span>
                </li>
                <li className="flex items-start gap-2">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>Basic encryption, not SOC2-ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <X size={16} className="text-red mt-0.5 flex-shrink-0" />
                  <span>Limited audit logging</span>
                </li>
              </ul>
            </div>

            {/* Infisical (AuthHub) */}
            <div className="border-2 border-teal bg-teal/10 p-6 rounded-none">
              <h3 className="font-dela text-xl text-teal mb-4 flex items-center gap-2">
                <Check size={20} />
                Infisical Storage (AuthHub)
              </h3>
              <ul className="space-y-2 font-mono text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>
                    Dedicated secrets management (Fortune 500 standard)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>AES-256 encryption, zero-knowledge architecture</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  <span>Comprehensive audit logs (SOC2-ready)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use case recommendations */}
      <section className="border-b-2 border-black bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-dela text-2xl md:text-3xl text-ink mb-12 text-center">
            Which Platform Is Right for You?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Leadsie */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <h3 className="font-dela text-xl text-ink mb-4">Choose Leadsie If</h3>
              <ul className="space-y-2 font-mono text-sm text-gray-700">
                <li>• You only need Meta + Google access</li>
                <li>• You want simple, no-frills onboarding</li>
                <li>• You have &lt;20 clients</li>
                <li>• Enterprise security isn't a priority</li>
              </ul>
            </div>

            {/* Other Platforms */}
            <div className="border-2 border-black p-6 rounded-none shadow-brutalist-sm">
              <h3 className="font-dela text-xl text-ink mb-4">
                Choose Other Platforms If
              </h3>
              <ul className="space-y-2 font-mono text-sm text-gray-700">
                <li>• You need broader platform coverage</li>
                <li>• You value platform count over features</li>
                <li>• You have &lt;50 clients</li>
                <li>• You don't need granular permissions</li>
              </ul>
            </div>

            {/* AuthHub */}
            <div className="border-[3px] border-coral p-6 rounded-none shadow-hard-xl bg-coral/5">
              <h3 className="font-dela text-xl text-coral mb-4">
                Choose AuthHub If
              </h3>
              <ul className="space-y-2 font-mono text-sm text-gray-700">
                <li>• You need Pinterest, Klaviyo, or Shopify</li>
                <li>• Enterprise-grade security is required</li>
                <li>• You want 4 granular permission levels</li>
                <li>• You need reusable templates</li>
                <li>• You have 50+ clients or plan to scale</li>
                <li>• You need SOC2 compliance documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-dela text-3xl md:text-4xl mb-4">
            Ready to Make the Switch?
          </h2>
          <p className="font-mono text-gray-300 mb-8 max-w-xl mx-auto">
            Start your 21-day free trial—the longest in the industry. See how
            50+ agencies reduced onboarding time by 90%.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button variant="brutalist-rounded" size="xl">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/blog">
              <Button variant="brutalist-ghost-rounded" size="xl">
                Read More Comparisons
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
