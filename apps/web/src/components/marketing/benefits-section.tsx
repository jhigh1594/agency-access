import { Check } from 'lucide-react';

const benefits = [
  {
    title: 'Save 2-3 Days Per Client',
    description:
      'What used to take days of back-and-forth emails now happens in 5 minutes. Start campaigns faster.',
  },
  {
    title: 'Eliminate Security Risks',
    description:
      'No more password sharing via email or Slack. OAuth tokens stored securely with full audit trails.',
  },
  {
    title: 'Reduce Client Friction',
    description:
      'Clients see familiar platform login screens. No confusing setup instructions or technical jargon.',
  },
  {
    title: 'Scale Your Agency',
    description:
      'Onboard 10 clients in the time it used to take for 1. Focus on strategy, not setup.',
  },
];

export function BenefitsSection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-4">
              Why Agencies Choose Us
            </h2>
            <p className="text-lg text-muted-foreground">
              Join agencies that have eliminated the biggest bottleneck in client onboarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex gap-4 p-6 rounded-xl border border-border bg-card"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-xl mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

