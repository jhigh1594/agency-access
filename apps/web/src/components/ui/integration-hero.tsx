"use client";

import React from "react";
import Image from "next/image";
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

export default function IntegrationHero() {
  return (
    <section className="relative py-32 overflow-hidden bg-white">
      {/* Light grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <span className="inline-block px-3 py-1 mb-4 text-sm rounded-full border border-gray-200 bg-white text-black">
          ⚡ Integration
        </span>
        <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tight text-gray-900">
          Connect, Automate, and Scale
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
          AuthHub integrates effortlessly with your favorite tools, ensuring a smooth and automated workflow.
        </p>
        <Button variant="primary" size="lg" className="mt-8">
          Get started
        </Button>

        {/* Carousel */}
        <div className="mt-12 overflow-hidden relative pb-2">
          {/* Row 1 */}
          <div className="flex gap-10 whitespace-nowrap animate-scroll-left">
            {repeatedIcons(ICONS_ROW1, 4).map((item, i) => {
              const Icon = item.icon;
              const bgColor = item.bgColor || "white";
              
              return (
                <div 
                  key={`row1-${i}`} 
                  className="h-16 w-16 flex-shrink-0 rounded-full shadow-md flex items-center justify-center border border-gray-100 overflow-hidden"
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
          <div className="flex gap-10 whitespace-nowrap mt-6 animate-scroll-right">
            {repeatedIcons(ICONS_ROW2, 4).map((item, i) => {
              const Icon = item.icon;
              const bgColor = item.bgColor || "white";
              
              return (
                <div 
                  key={`row2-${i}`} 
                  className="h-16 w-16 flex-shrink-0 rounded-full shadow-md flex items-center justify-center border border-gray-100 overflow-hidden"
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
          <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      </div>

    </section>
  );
}

