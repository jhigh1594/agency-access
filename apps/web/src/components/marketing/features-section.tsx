import { Shield, Zap, Users, BarChart3, Link2, Clock } from 'lucide-react';

const features = [
  {
    icon: Link2,
    title: 'Single Branded Link',
    description:
      'Send clients one link that handles all platform authorizations. Customize with your agency branding, logo, and colors.',
  },
  {
    icon: Zap,
    title: '5-Minute Setup',
    description:
      'Replace 2-3 days of back-and-forth emails with an automated flow. Clients complete authorization in minutes, not days.',
  },
  {
    icon: Shield,
    title: 'Secure OAuth Tokens',
    description:
      'No more password sharing. All tokens stored securely in Infisical with audit logging. Enterprise-grade security.',
  },
  {
    icon: Users,
    title: 'Multi-Platform Support',
    description:
      'Meta Ads, Google Ads, GA4, LinkedIn, TikTok, Snapchat, Instagram, and more. One flow, all platforms.',
  },
  {
    icon: BarChart3,
    title: 'Instant API Access',
    description:
      'Get immediate API-level access to client accounts. No waiting for permissions or manual verification.',
  },
  {
    icon: Clock,
    title: 'Token Health Monitoring',
    description:
      'Automatic token refresh and expiration alerts. Never lose access due to expired tokens.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground">
            Built specifically for marketing agencies who need fast, secure client onboarding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="relative rounded-xl border border-border bg-background p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="font-heading text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

