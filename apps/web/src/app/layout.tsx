import type { Metadata } from "next";
import { Fraunces, Outfit, JetBrains_Mono } from "next/font/google";
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
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
