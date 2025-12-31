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
    <section className="py-24 sm:py-32 bg-warm-gray/30 overflow-hidden border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-6">
            The OAuth Nightmare
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We&apos;ve all been there. Weeks of back-and-forth, confused clients, 
            and shared passwords. It&apos;s the #1 bottleneck for marketing agencies.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          <div className="flex-1 w-full space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className={`p-5 rounded-2xl max-w-[85%] border ${
                  msg.sender === 'Agency' 
                    ? 'bg-white border-border shadow-sm' 
                    : 'bg-primary/5 border-primary/10 ml-auto'
                }`}
              >
                <p className="font-medium text-foreground text-sm sm:text-base">{msg.text}</p>
                <span className="text-[10px] text-muted-foreground mt-2 block uppercase tracking-[0.2em] font-bold opacity-60">
                  {msg.sender}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex-1 relative w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative p-8 bg-white border border-border rounded-3xl shadow-xl"
            >
              <Image 
                src="/illustrations/chaos-illustration.svg" 
                alt="Chaos Illustration" 
                width={600} 
                height={400} 
                className="w-full h-auto opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none rounded-3xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
