import { ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Create Access Request',
    description:
      'Select platforms (Meta, Google Ads, etc.), customize branding, and generate a unique link.',
  },
  {
    number: '02',
    title: 'Client Clicks Link',
    description:
      'Client sees your branded page, fills out intake form, and authorizes each platform sequentially.',
  },
  {
    number: '03',
    title: 'Select Assets',
    description:
      'Client chooses which ad accounts, pages, or properties to share. Full control and transparency.',
  },
  {
    number: '04',
    title: 'Instant Access',
    description:
      'You get immediate API-level access. Tokens stored securely, refreshed automatically.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              From request to access in 5 minutes. Here's the flow:
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="font-mono-label text-primary text-2xl font-bold">
                      {step.number}
                    </span>
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="font-heading text-2xl mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center pt-8">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

