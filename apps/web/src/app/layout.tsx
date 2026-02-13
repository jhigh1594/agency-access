import type { Metadata } from "next";
import { Fraunces, Outfit, JetBrains_Mono, Dela_Gothic_One } from "next/font/google";
import { DeferredAnalytics } from "@/components/deferred-analytics";
import { Providers } from "./providers";
import "./globals.css";

// Preconnect to Google Fonts for faster font loading
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Hint for browsers to preconnect to Google Fonts
  // This is handled by next/font/google automatically, but we can add hints
};

// CRITICAL: Main font - use swap for fallback text visibility
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

// DEFERRED: Display fonts - use optional to avoid blocking render
// These will load in the background and only show if loaded quickly enough
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "optional",
});

const delaGothicOne = Dela_Gothic_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dela",
  display: "optional",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.authhub.co'),
  title: "AuthHub - Client Access in 5 Minutes",
  description: "One link replaces weeks of OAuth setup. Connect to Meta, Google Ads, GA4, LinkedIn, and more.",
  icons: {
    icon: "/authhub.png",
    apple: "/authhub.png",
  },
  openGraph: {
    title: "AuthHub - Client Access in 5 Minutes",
    description: "One link replaces weeks of OAuth setup.",
    images: ["/authhub.png"],
    url: "https://www.authhub.co",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/authhub.png"],
  },
  // DNS preconnect hints for faster Google Fonts loading
  other: {
    'x-dns-prefetch-control': 'on',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} ${jetbrainsMono.variable} ${delaGothicOne.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=window.location.pathname;var m=p==='/'||p.startsWith('/pricing')||p.startsWith('/blog')||p.startsWith('/terms')||p.startsWith('/privacy-policy')||p.startsWith('/compare');if(m){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}})();`,
          }}
        />
        <Providers>{children}</Providers>
        <DeferredAnalytics />
      </body>
    </html>
  );
}
