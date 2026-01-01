'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const messages = [
  { text: "Just send me your login for a second...", sender: "Agency" },
  { text: "What's a Business Manager?", sender: "Client" },
  { text: "I think I added you, can you check?", sender: "Client" },
  { text: "It's asking for a 2FA code!", sender: "Agency" },
];

export function PainSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-warm-gray/30 overflow-hidden border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Mobile optimized */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 md:mb-20 px-4">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4 sm:mb-6">
            The OAuth Nightmare
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
            We&apos;ve all been there. Weeks of back-and-forth, confused clients,
            and shared passwords. It&apos;s the #1 bottleneck for marketing agencies.
          </p>
        </div>

        {/* Chat & Illustration - Stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-24">
          {/* Chat Messages */}
          <div className="flex-1 w-full space-y-3 sm:space-y-4 max-w-lg mx-auto lg:mx-0">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl max-w-[280px] xs:max-w-[320px] sm:max-w-[85%] border touch-feedback ${
                  msg.sender === 'Agency'
                    ? 'bg-white border-border shadow-sm'
                    : 'bg-primary/5 border-primary/10 ml-auto'
                }`}
              >
                <p className="font-medium text-foreground text-xs sm:text-sm">{msg.text}</p>
                <span className="text-[10px] text-muted-foreground mt-1.5 sm:mt-2 block uppercase tracking-[0.2em] font-bold opacity-60">
                  {msg.sender}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Illustration */}
          <div className="flex-1 relative w-full max-w-lg mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative p-6 sm:p-8 bg-white border border-border rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl"
            >
              <Image
                src="/illustrations/chaos-illustration.svg"
                alt="Chaos Illustration"
                width={600}
                height={400}
                className="w-full h-auto opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none rounded-2xl sm:rounded-3xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
