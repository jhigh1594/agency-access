/**
 * Blog content types and data structure
 * Following the AuthHub brutalist design system
 */

export type BlogCategory =
  | "onboarding"
  | "tutorials"
  | "comparisons"
  | "security"
  | "operations"
  | "case-studies"
  | "research";

export type BlogStage = "awareness" | "consideration" | "decision";

export interface BlogAuthor {
  name: string;
  role: string;
  avatar?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  stage: BlogStage;
  publishedAt: string;
  readTime: number;
  author: BlogAuthor;
  featuredImage?: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  relatedPosts?: string[];
}

export interface BlogCategoryInfo {
  id: BlogCategory;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export const BLOG_CATEGORIES: Record<BlogCategory, BlogCategoryInfo> = {
  onboarding: {
    id: "onboarding",
    name: "Client Onboarding",
    description: "Eliminate friction and scale your agency onboarding",
    color: "coral",
    icon: "🚀",
  },
  tutorials: {
    id: "tutorials",
    name: "Platform Tutorials",
    description: "Step-by-step guides for each platform",
    color: "teal",
    icon: "📖",
  },
  comparisons: {
    id: "comparisons",
    name: "Comparisons",
    description: "Compare tools and make the right choice",
    color: "acid",
    icon: "⚖️",
  },
  security: {
    id: "security",
    name: "Security & Compliance",
    description: "Enterprise-grade security for client data",
    color: "ink",
    icon: "🔒",
  },
  operations: {
    id: "operations",
    name: "Agency Operations",
    description: "Build systems that scale agency growth",
    color: "purple",
    icon: "⚙️",
  },
  "case-studies": {
    id: "case-studies",
    name: "Case Studies",
    description: "Real results from real agencies",
    color: "blue",
    icon: "📊",
  },
  research: {
    id: "research",
    name: "Original Research",
    description: "Industry surveys and benchmarks",
    color: "orange",
    icon: "🔬",
  },
} as const;

export const BLOG_STAGES = {
  awareness: {
    name: "Awareness",
    description: "Top of funnel - discovering the problem",
    color: "gray",
  },
  consideration: {
    name: "Consideration",
    description: "Middle of funnel - evaluating solutions",
    color: "teal",
  },
  decision: {
    name: "Decision",
    description: "Bottom of funnel - ready to choose",
    color: "coral",
  },
} as const;
