'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

const steps = [
  { title: "One Link", description: "Generate a single, branded link for your client." },
  { title: "One Click", description: "Clients authorize all platforms in one session." },
  { title: "One Minute", description: "You get instant, secure token access." },
];

export function SolutionSection() {
  return (
    <section className="py-24 sm:py-32 overflow-hidden bg-calm/10 dark:bg-calm/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 relative order-2 lg:order-1 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-6 bg-card rounded-[2.5rem] border border-border shadow-2xl"
            >
              <Image 
                src="/illustrations/calm-illustration.svg" 
                alt="Solution Illustration" 
                width={600} 
                height={400} 
                className="w-full h-auto"
              />
              {/* Fake UI Overlay */}
              <div className="absolute top-12 right-12 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-secondary/20 shadow-sm animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                Access Granted
              </div>
            </motion.div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-8">
              One Link. <br />
              <span className="text-secondary">All Access.</span>
            </h2>
            
            <div className="space-y-10">
              {steps.map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xl">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

