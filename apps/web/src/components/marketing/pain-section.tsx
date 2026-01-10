'use client';

import { m } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Reveal } from './reveal';

// Chat messages with 3-day timeline narrative
const nightmareMessages = [
  {
    text: "Can you send access to your GA4 and Meta Business Manager?",
    sender: "Agency",
    time: "9:47 AM",
    day: 1
  },
  {
    text: "What's a Business Manager?",
    sender: "Client",
    time: "10:23 AM",
    day: 1
  },
  {
    text: "I think I added you but it says 'pending'",
    sender: "Client",
    time: "2:15 PM",
    day: 1
  },
  {
    text: "I haven't seen any access emails come through",
    sender: "Agency",
    time: "3:42 PM",
    day: 1
  },
  {
    text: "I have no idea how to add you to these accounts. Can we jump on a zoom?",
    sender: "Client",
    time: "Day 2",
    day: 2
  },
  {
    text: "Still waiting on that access. Can we get this sorted today?",
    sender: "Agency",
    time: "Day 3",
    day: 3
  }
];

// Pain point cards with clean, focused design
const painPoints = [
  {
    icon: "🔐",
    title: "Shared Credentials",
    description: "Asking for passwords. Security risk.",
    color: "bg-coral/10 border-coral/20"
  },
  {
    icon: "⏳",
    title: "3 Days Wasted",
    description: "Back-and-forth emails. 47 on average.",
    color: "bg-acid/10 border-acid/20"
  },
  {
    icon: "😤",
    title: "Frustrated Clients",
    description: "They don't understand OAuth.",
    color: "bg-teal/10 border-teal/20"
  },
  {
    icon: "💸",
    title: "Lost Revenue",
    description: "$200+ per hour spent onboarding.",
    color: "bg-purple/10 border-purple/20"
  }
];

// Stat ticker for visceral numbers
function StatTicker({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="font-dela">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

// Stat card component
function StatCard({
  value,
  label,
  description,
  color,
  delay = 0
}: {
  value: string;
  label: string;
  description: string;
  color: string;
  delay?: number;
}) {
  const bgColor = color === 'coral' ? 'bg-coral' : color === 'teal' ? 'bg-teal' : 'bg-acid';
  const textColor = color === 'coral' || color === 'teal' ? 'text-white' : 'text-ink';

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ translateX: -4, translateY: -4 }}
      className={`${bgColor} ${textColor} p-6 sm:p-8 border-2 border-black shadow-brutalist-xl hover:shadow-brutalist-xl transition-all duration-200 rounded-lg`}
    >
      <div className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 opacity-90">
        {label}
      </div>
      <div className="text-3xl sm:text-4xl md:text-5xl !leading-none mb-2">
        {color === 'coral' && <StatTicker end={3} duration={2} />}
        {color === 'teal' && <StatTicker end={47} duration={2.5} />}
        {color === 'acid' && value}
      </div>
      <div className="font-mono text-xs sm:text-sm opacity-75">
        {description}
      </div>
    </m.div>
  );
}

// Chat message component
function ChatMessage({
  message,
  index
}: {
  message: typeof nightmareMessages[0];
  index: number;
}) {
  const isAgency = message.sender === 'Agency';

  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
      className={`p-4 border-2 border-black shadow-brutalist hover:shadow-brutalist-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 rounded-lg ${
        isAgency
          ? 'bg-coral text-white max-w-[90%]'
          : 'bg-white text-ink max-w-[90%] ml-auto'
      }`}
    >
      <p className="font-medium text-sm mb-3 leading-relaxed">
        {message.text}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 font-mono">
          {message.sender}
        </span>
        <div className="flex items-center gap-2">
          {message.day > 1 && (
            <span className="text-[9px] uppercase tracking-wider font-bold bg-black/20 px-2 py-0.5 rounded">
              Day {message.day}
            </span>
          )}
          <span className="text-[10px] opacity-60 font-mono">
            {message.time}
          </span>
        </div>
      </div>
    </m.div>
  );
}

export function PainSection() {
  return (
    <section className="relative py-20 sm:py-24 md:py-32 bg-paper overflow-hidden">
      {/* Subtle diagonal lines overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none diagonal-lines" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* HEADER */}
        <Reveal delay={0.2}>
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 md:mb-20">
            {/* Warning badge */}
            <m.div
              initial={{ rotate: -2 }}
              whileInView={{ rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 border-2 border-coral bg-coral text-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] font-mono shadow-brutalist-lg mb-6 rounded-lg hover:shadow-brutalist-xl hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200"
            >
              <m.span
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚠️
              </m.span>
              The Reality of Agency Onboarding
              <m.span
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
              >
                ⚠️
              </m.span>
            </m.div>

            {/* Main headline */}
            <h2 className="font-dela text-4xl sm:text-5xl md:text-6xl lg:text-7xl !leading-[1.05] tracking-tight mb-6 text-ink">
              CLIENT
              <br />
              ONBOARDING
              <br />
              <span className="text-coral">
                IS BROKEN
              </span>
            </h2>

            {/* Subheadline */}
            <p className="font-sans text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed text-gray-600">
              "Insanity is doing the same thing over and over again and expecting different results."
            </p>
            <p className="font-mono text-sm sm:text-base font-bold text-coral mt-2">
              Stop the insanity. One link. Full client access
            </p>
          </div>
        </Reveal>

        {/* MAIN CONTENT - Split Narrative Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* LEFT COLUMN - Chat simulation */}
            <div className="space-y-3 sm:space-y-4">
              <Reveal delay={0.3}>
                <div className="space-y-3 sm:space-y-4">
                  {nightmareMessages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} index={i} />
                  ))}
                </div>
              </Reveal>
            </div>

            {/* RIGHT COLUMN - Stats stack */}
            <div className="space-y-4 sm:space-y-6 py-4">
              <StatCard
                value="3"
                label="Days Lost"
                description="Per client onboarding"
                color="coral"
                delay={0.4}
              />
              <StatCard
                value="47"
                label="Email Exchanges"
                description="Average per client"
                color="teal"
                delay={0.5}
              />
              <StatCard
                value="$600+"
                label="Revenue Lost"
                description="Per client onboarding"
                color="acid"
                delay={0.6}
              />
            </div>
          </div>

          {/* PAIN POINTS GRID */}
          <Reveal delay={0.8}>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mt-12 sm:mt-16">
              {painPoints.map((point, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + (i * 0.1) }}
                  whileHover={{ scale: 1.03 }}
                  className={`${point.color} text-ink p-4 sm:p-5 border-2 border-black shadow-brutalist hover:shadow-brutalist-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 rounded-lg`}
                >
                  <div className="text-2xl sm:text-3xl mb-2">{point.icon}</div>
                  <div className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 opacity-80">
                    {point.title}
                  </div>
                  <div className="font-medium text-xs sm:text-sm leading-tight opacity-90">
                    {point.description}
                  </div>
                </m.div>
              ))}
            </div>
          </Reveal>

          {/* BOTTOM CTA - Hope */}
          <Reveal delay={1}>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1, duration: 0.6 }}
              whileHover={{ translateX: -4, translateY: -4 }}
              className="mt-8 sm:mt-12 p-5 sm:p-6 bg-white border-2 border-black shadow-brutalist-lg hover:shadow-brutalist-xl transition-all duration-200 rounded-lg"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-2xl sm:text-3xl">💥</div>
                <div>
                  <div className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-coral mb-1.5">
                    STOP THE INSANITY
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Stop the insanity. One link. Full client access
                  </p>
                </div>
              </div>
            </m.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
