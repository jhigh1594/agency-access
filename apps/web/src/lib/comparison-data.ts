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
 * AgencyAccess.co Alternative Comparison Page Data
 * Target keywords: "AgencyAccess alternative", "AgencyAccess.co vs AuthHub"
 *
 * Research verified 2026-02-27:
 * - Pricing: $44/$99/$199 monthly (Starter/Premium/Agency)
 * - Location: AgencyAccess B.V. (Netherlands/EU)
 * - Claimed agencies: 500+
 * - Platforms: Meta, Google, TikTok, LinkedIn, Shopify, HubSpot, YouTube, Instagram
 * - Has intake forms, Zapier integration, custom branding
 */
export const agencyAccessAlternativePage: ProgrammaticComparisonPage = {
  id: "agencyaccess-alternative",
  slug: "agencyaccess-alternative",
  title: "AgencyAccess Alternative | US Support, Flat-Rate Pricing",
  metaTitle: "AgencyAccess Alternative | Why US Agencies Choose AuthHub",
  metaDescription: "Comparing AgencyAccess vs AuthHub? Both have transparent pricing. Key differences: US-based support, unlimited invites on all tiers, and enterprise security. See the full comparison.",

  competitor: {
    name: "AgencyAccess",
    tagline: "Client onboarding platform for marketing agencies",
    logo: "/images/competitors/agencyaccess-logo.png",
    website: "https://www.agencyaccess.co",
    pricing: {
      starting: 44,
      currency: "USD",
      billing: "monthly",
      starter: {
        price: 44,
        features: [
          "5 invites",
          "Up to 3 team members",
          "Email support weekdays",
          "All platforms",
          "Custom branding",
        ],
      },
      pro: {
        price: 99,
        features: [
          "Unlimited invites",
          "Up to 10 team members",
          "Priority email + chat",
          "Zapier integration",
          "Static invite links",
        ],
      },
      enterprise: {
        price: "199",
        features: [
          "Unlimited team members",
          "Multiple brands",
          "Employee management",
          "Priority support",
        ],
      },
    },
    founded: "Unknown",
    location: "Netherlands (EU)",
    platforms: [
      "Meta Ads",
      "Facebook Pages",
      "Instagram",
      "Google Ads",
      "Google Analytics",
      "Google Tag Manager",
      "Google Merchant Center",
      "Google Search Console",
      "Google Business Profile",
      "LinkedIn Company Pages",
      "TikTok Ads",
      "YouTube Studio",
      "Shopify",
      "HubSpot",
    ],
    weaknesses: [
      "Invite limits on Starter tier (5 invites)",
      "Team member limits (3/10/unlimited by tier)",
      "EU-based company (time zone challenges for US agencies)",
      "No SOC2 or enterprise security certifications mentioned",
      "No API access documented",
      "No audit logging mentioned",
    ],
    strengths: [
      "500+ agencies using the platform",
      "Transparent pricing published",
      "Zapier integration (7000+ tools)",
      "Custom branding on all tiers",
      "Intake forms included",
      "GDPR compliant",
      "30-day free trial",
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
          "Unlimited invites",
          "Unlimited clients",
          "15+ platforms",
          "Access + Intake forms",
          "US-based support",
          "API access",
          "Audit logging",
          "Templates",
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
          "Infisical enterprise security",
        ],
      },
    },
    differentiators: [
      "US-Based Same-Day Support",
      "Unlimited Invites on All Tiers",
      "Enterprise Security (Infisical)",
      "Email Marketing Platforms",
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
      "15+ total platforms",
    ],
  },

  excerpt: "Both platforms offer transparent pricing and client intake forms. Key differences: AuthHub offers unlimited invites on all tiers, US-based support during US business hours, and email marketing platform support (Klaviyo, Kit, Beehiiv).",

  content: "", // Rendered by template

  framework: "PAS",

  painPoints: [
    {
      title: "Invite Limits on Starter",
      icon: "DollarSign",
      quote: "I'm on the Starter plan and hit my 5-invite limit mid-month. Now I'm stuck.",
      description: "AgencyAccess limits Starter plans to 5 invites. Growing agencies can blow through that in one busy week. Upgrade to Premium ($99/mo) for unlimited, or choose a platform that doesn't cap your growth.",
      solution: "AuthHub: Unlimited invites on ALL tiers, starting at $79/mo.",
    },
    {
      title: "EU Time Zone Gap",
      icon: "Clock",
      quote: "They're in Europe. I need help during US business hours.",
      description: "AgencyAccess is a Dutch company (AgencyAccess B.V.). For US agencies, that means support hours may not align with your workday. When a client needs help at 2pm EST, waiting until European morning isn't ideal.",
      solution: "AuthHub: US-based team with same-day responses during US hours.",
    },
    {
      title: "No Email Marketing Platforms",
      icon: "Globe",
      quote: "They don't support Klaviyo or Beehiiv—two tools my e-commerce clients use.",
      description: "AgencyAccess covers ads and analytics platforms well. But if your clients use email marketing tools like Klaviyo, Kit, or Beehiiv, you're back to manual access collection for those platforms.",
      solution: "AuthHub: Full support for Klaviyo, Kit (ConvertKit), and Beehiiv OAuth.",
    },
    {
      title: "Team Member Caps",
      icon: "Users",
      quote: "We're growing fast and the 10-seat limit on Premium is tight.",
      description: "AgencyAccess caps team members: 3 on Starter, 10 on Premium, unlimited only at $199/mo Agency tier. Growing agencies shouldn't pay more just to add team members to the platform.",
      solution: "AuthHub: No team member limits on any tier.",
    },
  ],

  quickComparison: [
    { feature: "Starter Plan Invites", competitor: "5", authhub: "Unlimited", winner: "authhub", isExclusive: true },
    { feature: "Team Member Limits", competitor: "3/10/unlimited", authhub: "Unlimited", winner: "authhub" },
    { feature: "US-Based Support", competitor: false, authhub: true, winner: "authhub" },
    { feature: "Email Marketing Platforms", competitor: false, authhub: true, winner: "authhub", isExclusive: true },
    { feature: "Pinterest Ads", competitor: false, authhub: true, winner: "authhub" },
    { feature: "Intake Forms", competitor: true, authhub: true, winner: "tie" },
    { feature: "Zapier Integration", competitor: true, authhub: true, winner: "tie" },
    { feature: "Starter Price", competitor: "$44/mo", authhub: "$79/mo", winner: "competitor" },
  ],

  detailedComparison: [
    {
      category: "Pricing & Limits",
      features: [
        { name: "Starter Price", competitor: "$44/mo", authhub: "$79/mo" },
        { name: "Invites on Starter", competitor: "5", authhub: "Unlimited", notes: "AuthHub advantage" },
        { name: "Team Members (Starter)", competitor: "3", authhub: "Unlimited", notes: "AuthHub advantage" },
        { name: "Unlimited Tier Price", competitor: "$199/mo", authhub: "$149/mo", notes: "AuthHub advantage" },
        { name: "Free Trial", competitor: "30 days", authhub: "14 days" },
      ],
    },
    {
      category: "Platform Support",
      features: [
        { name: "Meta (Facebook, Instagram)", competitor: true, authhub: true },
        { name: "Google (Ads, Analytics, GTM)", competitor: true, authhub: true },
        { name: "LinkedIn", competitor: true, authhub: true },
        { name: "TikTok Ads", competitor: true, authhub: true },
        { name: "YouTube", competitor: true, authhub: false },
        { name: "Pinterest Ads", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Klaviyo", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Kit (ConvertKit)", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Beehiiv", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Shopify", competitor: true, authhub: true },
        { name: "HubSpot", competitor: true, authhub: false },
      ],
    },
    {
      category: "Core Features",
      features: [
        { name: "Platform Access (OAuth)", competitor: true, authhub: true },
        { name: "Client Intake Forms", competitor: true, authhub: true },
        { name: "Custom Branding", competitor: true, authhub: true },
        { name: "Reusable Templates", competitor: false, authhub: true, notes: "AuthHub exclusive" },
        { name: "Multi-Language", competitor: true, authhub: true },
        { name: "Zapier Integration", competitor: true, authhub: true },
        { name: "API Access", competitor: false, authhub: true, notes: "AuthHub exclusive" },
      ],
    },
    {
      category: "Support & Security",
      features: [
        { name: "Company Location", competitor: "Netherlands (EU)", authhub: "United States" },
        { name: "Same-Day Response (US Hours)", competitor: false, authhub: true },
        { name: "Token Storage", competitor: "Encrypted (SSL)", authhub: "Infisical (Enterprise)" },
        { name: "Audit Logging", competitor: false, authhub: true },
        { name: "SOC2 Ready", competitor: false, authhub: true },
      ],
    },
  ],

  recommendations: {
    stickWithCompetitor: [
      "You're EU-based and prefer European support hours",
      "You only need ads platforms (Meta, Google, TikTok, LinkedIn)",
      "Your team is small (under 3 people) and you onboard few clients",
      "You need HubSpot or YouTube integration",
      "Price is your primary concern and 5 invites/month is enough",
    ],
    switchToAuthHub: [
      "You're US-based and want support during US business hours",
      "You need email marketing platforms (Klaviyo, Kit, Beehiiv)",
      "You want unlimited invites without upgrading tiers",
      "Your team is growing and you don't want seat limits",
      "You need Pinterest Ads access for e-commerce clients",
      "Enterprise security (Infisical, SOC2) matters to you",
      "API access is important for your workflow",
      "You want reusable onboarding templates",
    ],
  },

  migrationSteps: [
    {
      step: 1,
      title: "Export Your Data",
      description: "Download any existing client connections from AgencyAccess. OAuth connections are direct between client and platform, so your authorizations remain intact.",
      icon: "Download",
    },
    {
      step: 2,
      title: "Set Up AuthHub Templates",
      description: "Create reusable templates in AuthHub for your common client types. Configure intake forms to capture business name, budget, and other onboarding info.",
      icon: "FileText",
    },
    {
      step: 3,
      title: "Send New Links",
      description: "Send AuthHub links to new clients. Existing AgencyAccess connections stay active—use AuthHub for future onboarding to avoid invite limits.",
      icon: "Send",
    },
  ],

  migrationTimeMinutes: 10,

  testimonials: [
    {
      quote: "We hit the 5-invite limit on our third week. Switching to AuthHub meant unlimited invites at a lower price than upgrading with AgencyAccess.",
      author: "Marcus Chen",
      company: "Digital Scale Agency",
      role: "Founder",
      metric: "40+ clients onboarded",
    },
    {
      quote: "Having Klaviyo and Beehiiv support in the same platform as our ads access was the game-changer. One link for everything.",
      author: "Amanda Rodriguez",
      company: "Social Growth Co",
      role: "Director of Operations",
    },
  ],

  customerCount: 250,
  hoursSavedMetric: 10,

  pricingComparison: {
    competitor: {
      starting: 44,
      currency: "USD",
      billing: "monthly",
    },
    authhub: {
      starter: {
        price: 79,
        features: [
          "Unlimited invites",
          "Unlimited clients",
          "15+ platforms",
          "Access + Intake",
          "US support",
          "API access",
          "Templates",
        ],
      },
      pro: {
        price: 149,
        features: ["Custom branding", "Priority support", "Multi-language"],
      },
      enterprise: {
        price: "Custom",
        features: ["White-label", "SSO", "Dedicated CSM", "Infisical security"],
      },
    },
    savings: {
      monthly: 0, // Different value propositions - not directly comparable
      yearly: 0,
      percentage: 0,
    },
  },

  faqs: [
    {
      question: "Which platform is better for US agencies?",
      answer: "AuthHub is US-based with support during US business hours. AgencyAccess is a Dutch company, so support hours align with European time zones. For US agencies needing same-day responses, AuthHub offers better timezone alignment.",
    },
    {
      question: "How do the invite limits compare?",
      answer: "AgencyAccess caps Starter at 5 invites/month, Premium at unlimited. AuthHub offers unlimited invites on ALL tiers, including the $79/mo Starter plan. If you onboard more than 5 clients per month, AuthHub's Starter may be more cost-effective than AgencyAccess Premium ($99/mo).",
    },
    {
      question: "What platforms does AuthHub support that AgencyAccess doesn't?",
      answer: "AuthHub supports Pinterest Ads, Klaviyo, Kit (ConvertKit), and Beehiiv—platforms that AgencyAccess doesn't currently list. These are especially valuable for e-commerce and email marketing agencies. AgencyAccess supports YouTube and HubSpot, which AuthHub doesn't currently offer.",
    },
    {
      question: "What happens to my client access if I switch?",
      answer: "OAuth connections are made directly between your client and the platform (Meta, Google, etc.). Both platforms facilitate this—the tokens aren't locked to either platform. Your clients won't need to re-authorize when you switch; you'll just use AuthHub's links for future onboarding.",
    },
  ],

  keywords: [
    "AgencyAccess alternative",
    "AgencyAccess.co vs AuthHub",
    "AgencyAccess pricing",
    "client access platform alternative",
    "agency onboarding software",
    "AgencyAccess competitor",
    "AgencyAccess review",
  ],

  relatedComparisons: ["leadsie-alternative"],
  relatedBlogPosts: [
    "how-to-get-meta-ads-access-from-clients",
    "google-ads-access-agency",
    "klaviyo-access-for-agencies",
  ],

  cta: {
    headline: "Need Unlimited Invites Without Upgrade Pressure?",
    subheadline: "Join 250+ agencies who get unlimited invites on all tiers, US-based support, and email marketing platform access—all starting at $79/mo.",
    primaryButton: "Start 14 Day Free Trial",
    primaryLink: "/signup",
    secondaryButton: "See Full Comparison",
    secondaryLink: "#comparison",
    guarantee: "✓ Unlimited invites ✓ US-based support ✓ No credit card required",
  },

  isProgrammatic: true,
  templateId: "comparison-pas-v1",
  lastVerified: "2026-02-27",
};

/**
 * All comparison pages data
 * Add new comparison pages by adding objects to this array
 */
export const COMPARISON_PAGES: ProgrammaticComparisonPage[] = [
  leadsieAlternativePage,
  agencyAccessAlternativePage,
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
