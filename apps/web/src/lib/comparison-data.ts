/**
 * Comparison Page Data
 * Structured data for programmatic comparison pages
 */

import type { ProgrammaticComparisonPage } from "./programmatic-types";

/**
 * Leadsie Alternative Comparison Page Data
 * Target keywords: "Leadsie alternative", "Leadsie vs AuthHub"
 */
export const leadsieAlternativePage: ProgrammaticComparisonPage = {
  id: "leadsie-alternative",
  slug: "leadsie-alternative",
  title: "Leadsie Alternative | Why Agencies Switch to AuthHub",
  metaTitle: "Leadsie Alternative | Why Agencies Switch to AuthHub",
  metaDescription: "Looking for a Leadsie alternative? AuthHub combines access + intake in one link, flat-rate pricing at $79/mo, and US-based support. See why agencies made the switch.",

  competitor: {
    name: "Leadsie",
    tagline: "Client access platform for marketing agencies",
    logo: "/images/competitors/leadsie-logo.png",
    website: "https://leadsie.io",
    pricing: {
      starting: 99,
      currency: "USD",
      billing: "monthly",
      starter: {
        price: 99,
        features: [
          "5 access requests/month",
          "~8 platforms",
          "Email support",
          "Basic reporting",
        ],
      },
      pro: {
        price: 199,
        features: [
          "Unlimited requests",
          "All platforms",
          "Priority support",
          "Team members",
        ],
      },
      enterprise: {
        price: "Custom",
        features: [
          "White-label option",
          "Dedicated support",
          "SLA",
          "Custom integrations",
        ],
      },
    },
    founded: "2019",
    location: "UK",
    platforms: [
      "Meta Ads",
      "Facebook Pages",
      "Instagram",
      "Google Ads",
      "Google Analytics",
      "LinkedIn Ads",
      "TikTok Ads",
      "Snapchat Ads",
    ],
    weaknesses: [
      "No client intake forms",
      "UK-based support (8hr time difference)",
      "Limited platform support (no Pinterest, Klaviyo, Shopify)",
      "No reusable onboarding templates",
      "No API access on lower tiers",
    ],
    strengths: [
      "Simple, clean interface",
      "Good documentation",
      "Established brand in UK/EU",
      "Quick setup",
    ],
  },

  ourProduct: {
    name: "AuthHub",
    tagline: "Access + Intake in One Professional Link",
    logo: "/logo.png",
    pricing: {
      starting: 79,
      currency: "USD",
      billing: "monthly",
      starter: {
        price: 79,
        features: [
          "Unlimited clients",
          "15+ platforms",
          "Access + Intake forms",
          "US-based support",
          "API access",
          "Audit logging",
        ],
      },
      pro: {
        price: 149,
        features: [
          "Everything in Starter",
          "Custom branding",
          "Reusable templates",
          "Priority support",
          "Multi-language (EN, ES, NL)",
        ],
      },
      enterprise: {
        price: "Custom",
        features: [
          "Full white-label",
          "SSO",
          "Dedicated CSM",
          "SLA guarantee",
          "Custom integrations",
        ],
      },
    },
    differentiators: [
      "Access + Intake in One Link",
      "Flat-Rate Pricing",
      "US-Based Support",
      "15+ Platforms",
    ],
    platforms: [
      "Meta Ads",
      "Facebook Pages",
      "Instagram",
      "WhatsApp Business",
      "Google Ads",
      "GA4",
      "Google Tag Manager",
      "Merchant Center",
      "Search Console",
      "LinkedIn Ads",
      "TikTok Ads",
      "Snapchat Ads",
      "Pinterest Ads",
      "Klaviyo",
      "Kit (ConvertKit)",
      "Beehiiv",
      "Shopify",
    ],
  },

  excerpt: "Stop juggling separate tools for access and intake. Get both in one professional link—at a predictable flat rate. Save $240/year compared to Leadsie's Agency tier.",

  content: "", // Rendered by component from structured data

  framework: "AIDA",

  painPoints: [
    {
      title: "Credit Anxiety",
      icon: "DollarSign",
      quote: "I never know what my bill will be each month.",
      description:
        "Usage-based pricing creates unpredictable costs. One busy month throws your budget. Growing agencies need predictable expenses they can plan around.",
      solution: "Flat-rate $79/mo with unlimited clients",
    },
    {
      title: "Two-Step Onboarding",
      icon: "ArrowRight",
      quote: "I look unprofessional sending multiple links to new clients.",
      description:
        "Leadsie handles access. You still need Google Forms or Typeform for intake. Two links, two emails, two chances for clients to drop off.",
      solution: "One link handles OAuth AND collects client info",
    },
    {
      title: "UK Support Hours",
      icon: "Clock",
      quote: "They're in the UK, I'm in the US. Response times don't work.",
      description:
        "8-hour time difference means next-day responses. When a client is locked out during your business hours, waiting until tomorrow isn't an option.",
      solution: "US-based support with same-day responses",
    },
    {
      title: "Missing Platforms",
      icon: "Globe",
      quote: "They don't support Pinterest, Klaviyo, or Shopify.",
      description:
        "E-commerce and email agencies need platforms beyond Meta and Google. Limited support means manual workarounds or turning away clients.",
      solution: "15+ platforms including Pinterest, Klaviyo, Shopify, Kit, Beehiiv",
    },
  ],

  quickComparison: [
    { feature: "Platform Count", competitor: "~8", authhub: "15+", winner: "authhub" },
    { feature: "Client Intake Forms", competitor: false, authhub: true, winner: "authhub", isExclusive: true },
    { feature: "US-Based Support", competitor: false, authhub: true, winner: "authhub" },
    { feature: "Onboarding Templates", competitor: false, authhub: true, winner: "authhub", isExclusive: true },
    { feature: "API Access (All Tiers)", competitor: false, authhub: true, winner: "authhub", isExclusive: true },
    { feature: "Flat-Rate Pricing", competitor: false, authhub: true, winner: "authhub" },
    { feature: "Starting Price", competitor: "$99/mo", authhub: "$79/mo", winner: "authhub" },
  ],

  detailedComparison: [
    {
      category: "Platform Support",
      features: [
        { name: "Meta (Facebook, Instagram)", competitor: true, authhub: true },
        { name: "Google (Ads, Analytics)", competitor: true, authhub: true },
        { name: "LinkedIn Ads", competitor: true, authhub: true },
        { name: "TikTok Ads", competitor: true, authhub: true },
        { name: "Snapchat Ads", competitor: true, authhub: true },
        { name: "Pinterest Ads", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Klaviyo", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Kit (ConvertKit)", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Beehiiv", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Shopify", competitor: false, authhub: true, notes: "AuthHub exclusive" },
      ],
    },
    {
      category: "Core Features",
      features: [
        { name: "Client Intake Forms", competitor: false, authhub: true },
        { name: "Permission Levels", competitor: "2-3", authhub: "4 (admin, standard, read_only, email_only)" },
        { name: "Reusable Templates", competitor: false, authhub: true },
        { name: "Custom Branding", competitor: "Limited", authhub: "Full white-label" },
        { name: "API Access", competitor: "Enterprise only", authhub: "All tiers" },
        { name: "Multi-Language", competitor: false, authhub: "EN, ES, NL" },
      ],
    },
    {
      category: "Support & Security",
      features: [
        { name: "Support Location", competitor: "UK (GMT)", authhub: "US (EST/PST)" },
        { name: "Response Time", competitor: "Next business day", authhub: "Same day" },
        { name: "Token Storage", competitor: "Database", authhub: "Infisical (Enterprise-grade)" },
        { name: "Audit Logging", competitor: "Basic", authhub: "Comprehensive (SOC2-ready)" },
      ],
    },
  ],

  recommendations: {
    stickWithCompetitor: [
      "You only need Meta + Google access",
      "You're UK-based and don't need US support hours",
      "You have fewer than 20 clients",
      "You already have a separate intake process that works well",
      "Enterprise security requirements aren't a priority",
    ],
    switchToAuthHub: [
      "You need Pinterest, Klaviyo, or Shopify access",
      "You're tired of sending multiple links for client onboarding",
      "You're US-based and want same-day support",
      "You want predictable, flat-rate pricing",
      "You have 20+ clients or plan to scale",
      "You need reusable onboarding templates",
      "Enterprise-grade security and audit logs are required",
    ],
  },

  migrationSteps: [
    {
      step: 1,
      title: "Export from Leadsie",
      description:
        "Download your existing connections and client data from Leadsie's dashboard. This gives you a record of all active authorizations.",
    },
    {
      step: 2,
      title: "Create Your Templates",
      description:
        "Set up reusable templates in AuthHub for your common client types (e-commerce, lead gen, local business). This speeds up future onboarding.",
    },
    {
      step: 3,
      title: "Send New Links",
      description:
        "Send AuthHub links to active clients. Existing Leadsie connections stay live until clients re-authorize through AuthHub—no downtime.",
    },
  ],

  migrationTimeMinutes: 15,

  testimonials: [
    {
      quote:
        "We switched from Leadsie and immediately noticed the difference. One link instead of two, and our clients love the integrated intake form.",
      author: "Mike Torres",
      company: "Scale Media Partners",
      role: "CEO",
      previousTool: "Former Leadsie user",
      metric: "Saved 8 hours/month",
    },
    {
      quote:
        "The US-based support was the deciding factor. Getting same-day responses during our business hours is huge for client retention.",
      author: "Jennifer Walsh",
      company: "Digital Growth Co",
      role: "Director of Operations",
      previousTool: "Former Leadsie user",
    },
  ],

  customerCount: 250,
  hoursSavedMetric: 12,

  pricingComparison: {
    competitor: {
      starting: 99,
      currency: "USD",
      billing: "monthly",
    },
    authhub: {
      starter: {
        price: 79,
        features: [
          "Unlimited clients",
          "15+ platforms",
          "Access + Intake",
          "US support",
          "API access",
        ],
      },
      pro: {
        price: 149,
        features: [
          "Custom branding",
          "Reusable templates",
          "Priority support",
          "Multi-language",
        ],
      },
      enterprise: {
        price: "Custom",
        features: ["White-label", "SSO", "Dedicated CSM", "SLA"],
      },
    },
    savings: {
      monthly: 20,
      yearly: 240,
      percentage: 20,
    },
  },

  faqs: [
    {
      question: "How long does it take to migrate from Leadsie to AuthHub?",
      answer:
        "Most agencies complete the migration in 15-30 minutes. Export your client list from Leadsie, set up templates in AuthHub, and send new links to active clients. Existing connections remain active until clients re-authorize.",
    },
    {
      question: "Will my clients need to re-authorize their accounts?",
      answer:
        "Yes, clients will need to authorize their accounts through AuthHub. However, the process takes just 2-3 minutes per platform, and you can send them a single link that handles all platforms at once.",
    },
    {
      question: "Does AuthHub support all the same platforms as Leadsie?",
      answer:
        "AuthHub supports all platforms Leadsie supports plus Pinterest, Klaviyo, Kit, Beehiiv, and Shopify—15+ total platforms vs Leadsie's ~8.",
    },
    {
      question: "What's the difference between AuthHub and Leadsie's intake approach?",
      answer:
        "Leadsie requires a separate tool (Google Forms, Typeform) for client intake. AuthHub includes customizable intake forms built into the authorization flow—clients complete everything in one seamless experience.",
    },
  ],

  keywords: [
    "Leadsie alternative",
    "Leadsie vs AuthHub",
    "client access platform alternative",
    "agency onboarding software",
    "Leadsie pricing comparison",
    "Leadsie competitor",
  ],

  relatedComparisons: [],
  relatedBlogPosts: [
    "how-to-get-meta-ads-access-from-clients",
    "google-ads-access-agency",
    "ga4-access-agencies",
  ],

  cta: {
    headline: "Ready to Streamline Your Onboarding?",
    subheadline:
      "Start your 14-day free trial today. No credit card required. See why agencies switched from Leadsie to AuthHub.",
    primaryButton: "Start 14 Day Free Trial",
    primaryLink: "/signup",
    secondaryButton: "View Pricing",
    secondaryLink: "/pricing",
    guarantee: "✓ Access + Intake in one link  ✓ $79/mo flat rate  ✓ US-based support",
  },

  isProgrammatic: true,
  templateId: "comparison-aida-v1",
  lastVerified: "2025-02-27",
};

/**
 * All comparison pages data
 * Add new comparison pages by adding objects to this array
 */
export const COMPARISON_PAGES: ProgrammaticComparisonPage[] = [
  leadsieAlternativePage,
  // Add more comparison pages here:
  // otherPlatformAlternativePage,
  // anotherCompetitorAlternativePage,
];

/**
 * Get comparison page by slug
 */
export function getComparisonPageBySlug(slug: string): ProgrammaticComparisonPage | undefined {
  return COMPARISON_PAGES.find((page) => page.slug === slug);
}

/**
 * Get all comparison page slugs for static generation
 */
export function getAllComparisonPageSlugs(): string[] {
  return COMPARISON_PAGES.map((page) => page.slug);
}

/**
 * Get related comparison pages (for internal linking)
 */
export function getRelatedComparisons(currentSlug: string, limit = 3): ProgrammaticComparisonPage[] {
  return COMPARISON_PAGES.filter((page) => page.slug !== currentSlug).slice(0, limit);
}
