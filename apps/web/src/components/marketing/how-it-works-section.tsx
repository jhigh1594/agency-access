'use client';

import { motion } from 'framer-motion';
import { MousePointer2, Link as LinkIcon, ShieldCheck, Zap } from 'lucide-react';

const steps = [
  {
    icon: LinkIcon,
    title: 'Generate Link',
    desc: 'Select platforms and get your branded link.',
  },
  {
    icon: MousePointer2,
    title: 'Client Authorizes',
    desc: 'Client clicks and grants access in seconds.',
  },
  {
    icon: ShieldCheck,
    title: 'Choose Assets',
    desc: 'Client selects ad accounts and pages.',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    desc: 'You get secure, long-lived tokens.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-6">
            Four Steps to Freedom
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We&apos;ve simplified the most annoying part of agency life into a 
            seamless, automated flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Connecting Lines (Desktop) */}
          <div className="hidden lg:block absolute top-1/4 left-[10%] right-[10%] h-px bg-border -z-10" />
          
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              <div className="w-16 h-16 rounded-[1.25rem] bg-background border border-border flex items-center justify-center text-primary mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
