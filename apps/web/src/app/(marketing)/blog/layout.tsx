/**
 * Blog layout - extends the marketing layout with blog-specific structure
 * Note: MarketingNav and MarketingFooter are provided by parent (marketing) layout
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Agency Access Platform",
  description:
    "Expert guides, tutorials, and strategies for marketing agencies. Learn how to streamline client onboarding, manage platform access, and scale your agency.",
  keywords: [
    "blog",
    "agency resources",
    "client onboarding",
    "Meta Ads tutorial",
    "Google Ads guide",
    "agency growth",
  ],
  openGraph: {
    title: "Blog | Agency Access Platform",
    description:
      "Expert guides, tutorials, and strategies for marketing agencies.",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The parent (marketing) layout already provides MarketingNav and MarketingFooter
  return children;
}
