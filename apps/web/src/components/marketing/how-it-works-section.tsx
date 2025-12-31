'use client';

import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@/components/ui/ui-icons';
import { Button } from '@/components/ui/button';
import { SignUpButton } from '@clerk/nextjs';

const steps = [
  {
    number: 1,
    title: 'Generate Link',
    description: 'Select platforms and get your branded link.',
  },
  {
    number: 2,
    title: 'Client Authorizes',
    description: 'Client clicks and grants access in seconds.',
  },
  {
    number: 3,
    title: 'Choose Assets',
    description: 'Client selects ad accounts and pages.',
  },
  {
    number: 4,
    title: 'Instant Access',
    description: 'You get secure, long-lived tokens.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background with subtle gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-accent/5 to-background -z-10" />
      <div 
        className="absolute inset-0 opacity-[0.03] -z-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, transparent, transparent 35px, rgb(var(--foreground)) 35px, rgb(var(--foreground)) 70px)
          `,
        }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Main Card */}
          <div className="bg-card border border-border/60 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Left Section */}
              <div className="flex flex-col justify-center">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 w-fit mb-6"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    How It Works
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6 text-foreground leading-tight"
                >
                  Automate In 4 Steps!
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed"
                >
                  We&apos;ve simplified the most annoying part of agency life into a 
                  seamless, automated flow. Here&apos;s how it works—
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <SignUpButton mode="modal">
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="rounded-xl shadow-lg shadow-primary/20"
                      rightIcon={<ArrowRightIcon size={16} />}
                    >
                      Get Started
                    </Button>
                  </SignUpButton>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="rounded-xl"
                  >
                    Learn More
                  </Button>
                </motion.div>
              </div>

              {/* Right Section - Steps */}
              <div className="flex flex-col gap-6">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index + 0.2 }}
                    className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20"
                  >
                    {/* Step Badge */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
                          <span className="text-xs font-bold text-primary">
                            Step {step.number}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
