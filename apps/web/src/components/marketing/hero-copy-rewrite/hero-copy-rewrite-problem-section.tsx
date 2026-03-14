'use client';

import { m } from 'framer-motion';
import { AlertTriangle, Mail, MessagesSquare, TimerReset } from 'lucide-react';
import { Reveal } from '@/components/marketing/reveal';
import { useAnimationOrchestrator } from '@/hooks/use-animation-orchestrator';

const messages = [
  {
    text: 'Can you send access to your Meta, Google Ads, and GA4 accounts before kickoff?',
    sender: 'Agency',
    time: '9:47 AM',
    day: 1,
  },
  {
    text: 'I found one of them, but I do not know if I picked the right permission settings.',
    sender: 'Client',
    time: '10:23 AM',
    day: 1,
  },
  {
    text: 'I added you in one place, but LinkedIn still looks different from your screenshots.',
    sender: 'Client',
    time: '2:15 PM',
    day: 1,
  },
  {
    text: 'Still waiting on the rest so we can start the account setup work.',
    sender: 'Agency',
    time: '3:42 PM',
    day: 1,
  },
  {
    text: 'Can we jump on a call? I am stuck halfway through the access steps.',
    sender: 'Client',
    time: 'Day 2',
    day: 2,
  },
  {
    text: 'Kickoff is ready on our side, but access is still spread across email threads.',
    sender: 'Agency',
    time: 'Day 3',
    day: 3,
  },
];

const problemCards = [
  {
    label: 'Manual instructions',
    description: "Meta's Business Manager looks nothing like Google Ads Admin. LinkedIn is a third thing entirely. Your screenshots are outdated before the client even opens them.",
    icon: Mail,
    color: 'coral',
  },
  {
    label: 'Client confusion',
    description: "Your client wants to help. But they're searching 'how to add an agency to Meta' in a new tab while you wait for the access that unblocks everything.",
    icon: MessagesSquare,
    color: 'teal',
  },
  {
    label: 'Delayed kickoff',
    description: "You can't build campaigns you can't see. Every day without access is a day the client wonders what they're paying for.",
    icon: TimerReset,
    color: 'acid',
  },
];

function ChatMessage({
  message,
  index,
}: {
  message: (typeof messages)[0];
  index: number;
}) {
  const { shouldAnimate, animationsReady } = useAnimationOrchestrator();
  const isAgency = message.sender === 'Agency';

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, x: isAgency ? -50 : 50, y: 20 } : false}
      animate={shouldAnimate && animationsReady ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{ delay: index * 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`p-4 border-2 border-black shadow-brutalist transition-all duration-200 rounded-lg ${
        isAgency ? 'bg-coral text-white max-w-[90%]' : 'bg-card text-ink max-w-[90%] ml-auto'
      }`}
    >
      <p className="font-medium text-sm mb-3 leading-relaxed">{message.text}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest font-bold opacity-70 font-mono">
          {message.sender}
        </span>
        <div className="flex items-center gap-2">
          {message.day > 1 ? (
            <span className="text-[9px] uppercase tracking-wider font-bold bg-black/20 px-2 py-0.5 rounded">
              Day {message.day}
            </span>
          ) : null}
          <span className="text-[10px] opacity-60 font-mono">{message.time}</span>
        </div>
      </div>
    </m.div>
  );
}

export function HeroCopyRewriteProblemSection() {
  const { shouldAnimate } = useAnimationOrchestrator();

  return (
    <section className="relative py-20 sm:py-24 md:py-32 bg-paper overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none diagonal-lines" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal delay={0.2}>
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 md:mb-20">
            <m.div
              initial={shouldAnimate ? { rotate: -2 } : false}
              whileInView={shouldAnimate ? { rotate: 0 } : undefined}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 border-2 border-coral bg-coral text-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] font-mono shadow-brutalist-lg mb-6 rounded-lg transition-all duration-200"
            >
              <AlertTriangle size={14} />
              The onboarding tax
            </m.div>

            <h2 className="font-dela text-4xl sm:text-5xl md:text-6xl lg:text-7xl !leading-[1.05] tracking-tight mb-6 text-ink">
              THE ACCESS STEP
              <br />
              <span className="text-coral">SLOWS EVERYTHING DOWN</span>
            </h2>

            <p className="font-sans text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-gray-600">
              You feel this on every new engagement. The work is ready, the team
              is ready, and then you spend three days chasing platform access
              before you can start any of it.
            </p>
            <p className="font-mono text-sm sm:text-base font-bold text-coral mt-2">
              The problem is not demand. The problem is the handoff.
            </p>
          </div>
        </Reveal>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message, index) => (
                <ChatMessage key={`${message.time}-${index}`} message={message} index={index} />
              ))}
            </div>

            <div className="space-y-4 sm:space-y-6 py-4">
              {problemCards.map((card, index) => (
                <m.div
                  key={card.label}
                  initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
                  whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                  className="p-6 sm:p-8 border-2 border-black shadow-brutalist-xl rounded-lg bg-card"
                >
                  <div className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 opacity-90 text-gray-600">
                    {card.label}
                  </div>
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 border-2 border-black rounded-[0.75rem] ${
                        card.color === 'coral'
                          ? 'bg-coral/15'
                          : card.color === 'teal'
                            ? 'bg-teal/15'
                            : 'bg-acid/20'
                      }`}
                    >
                      <card.icon className="w-6 h-6 text-ink" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl md:text-4xl !leading-none mb-2 font-dela text-ink">
                        {card.label}
                      </div>
                      <div className="font-mono text-xs sm:text-sm opacity-75 text-gray-600">
                        {card.description}
                      </div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
