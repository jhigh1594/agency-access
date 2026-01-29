import type { Metadata } from "next";
import { Fraunces, Outfit, JetBrains_Mono, Dela_Gothic_One } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const delaGothicOne = Dela_Gothic_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dela",
  display: "swap",
});

export const metadata: Metadata = {
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
    url: "https://authhub.io",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/authhub.png"],
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
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
