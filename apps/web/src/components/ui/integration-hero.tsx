"use client";

import React from "react";
import Image from "next/image";
import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  SiGoogle,
  SiMeta,
  SiLinkedin,
  SiSnapchat,
  SiTiktok,
  SiInstagram,
  SiZapier,
  SiGoogleanalytics,
} from "react-icons/si";
import type { IconType } from "react-icons";
import { Zap } from "lucide-react";

interface IconItem {
  icon?: IconType;
  image?: string;
  color?: string;
  name: string;
  bgColor?: string;
}

// Row 1 icons
const ICONS_ROW1: IconItem[] = [
  { icon: SiGoogle, color: "#4285F4", name: "Google" },
  { icon: SiMeta, color: "#0668E1", name: "Meta" },
  { icon: SiLinkedin, color: "#0A66C2", name: "LinkedIn" },
  { icon: SiSnapchat, color: "#FFFC00", name: "Snapchat" },
  { icon: SiTiktok, color: "#000000", name: "TikTok" },
  { icon: SiInstagram, color: "#E1306C", name: "Instagram" },
  { icon: SiZapier, color: "#FF4A00", name: "Zapier" },
  { image: "/beehiiv.jpg", name: "Beehiiv", bgColor: "#ffffff" },
  { image: "/kit.jpg", name: "Kit" },
];

// Row 2 icons (can repeat or use different ones)
const ICONS_ROW2: IconItem[] = [
  { icon: SiGoogleanalytics, color: "#F9AB00", name: "Google Analytics" },
  { icon: SiGoogle, color: "#4285F4", name: "Google Ads" },
  { icon: SiMeta, color: "#0668E1", name: "Meta Ads" },
  { icon: SiLinkedin, color: "#0A66C2", name: "LinkedIn Ads" },
  { icon: SiTiktok, color: "#000000", name: "TikTok Ads" },
  { icon: SiSnapchat, color: "#FFFC00", name: "Snapchat Ads" },
  { icon: SiInstagram, color: "#E1306C", name: "Instagram Business" },
  { image: "/kit.jpg", name: "Kit" },
  { image: "/beehiiv.jpg", name: "Beehiiv", bgColor: "#ffffff" },
];

// Utility to repeat icons enough times for seamless scroll
const repeatedIcons = (icons: IconItem[], repeat = 4): IconItem[] =>
  Array.from({ length: repeat }).flatMap(() => icons);

const handleTrialSignup = () => {
  localStorage.setItem("selectedSubscriptionTier", "STARTER");
  localStorage.setItem("selectedBillingInterval", "yearly");
};

export default function IntegrationHero() {
  return (
    <section className="relative py-32 overflow-hidden bg-card border-y-2 border-black">
      {/* Brutalist grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 border-2 border-black bg-acid text-black px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono shadow-brutalist rounded-[0.75rem] mb-6">
          <Zap size={14} />
          Integration
        </div>
        <h1 className="font-dela text-4xl lg:text-6xl tracking-tight text-ink">
          Connect, Automate, and Scale
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto font-mono">
          AuthHub integrates effortlessly with your favorite tools, ensuring a smooth and automated workflow.
        </p>
        <div className="flex justify-center">
          <SignUpButton mode="modal">
            <Button
              variant="brutalist"
              size="lg"
              className="mt-8 min-w-[200px]"
              onClick={handleTrialSignup}
            >
              Get Started
            </Button>
          </SignUpButton>
        </div>

        {/* Carousel - Brutalist platform cards */}
        <div className="mt-12 overflow-hidden relative pb-2">
          {/* Row 1 */}
          <div className="flex gap-6 whitespace-nowrap animate-scroll-left">
            {repeatedIcons(ICONS_ROW1, 4).map((item, i) => {
              const Icon = item.icon;
              const bgColor = item.bgColor || "white";

              return (
                <div
                  key={`row1-${i}`}
                  className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 border-2 border-black shadow-[4px_4px_0px_#000] rounded-none flex items-center justify-center overflow-hidden hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                  style={{ backgroundColor: bgColor }}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                  ) : Icon ? (
                    <Icon size={32} style={{ color: item.color }} />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Row 2 */}
          <div className="flex gap-6 whitespace-nowrap mt-6 animate-scroll-right">
            {repeatedIcons(ICONS_ROW2, 4).map((item, i) => {
              const Icon = item.icon;
              const bgColor = item.bgColor || "white";

              return (
                <div
                  key={`row2-${i}`}
                  className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 border-2 border-black shadow-[4px_4px_0px_#000] rounded-none flex items-center justify-center overflow-hidden hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
                  style={{ backgroundColor: bgColor }}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                  ) : Icon ? (
                    <Icon size={32} style={{ color: item.color }} />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Fade overlays */}
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white via-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white to-transparent pointer-events-none" />
        </div>
      </div>

    </section>
  );
}
