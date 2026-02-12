/**
 * Design System Token Reference
 *
 * A visual showcase of all design tokens for the Agency Access Platform.
 * Access at /design-system during development.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { HealthBadge } from '@/components/ui/health-badge';
import { PlatformIcon } from '@/components/ui/platform-icon';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="font-dela text-5xl md:text-6xl mb-4">Design System</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Visual reference for the Agency Access Platform design tokens and components.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl py-12 space-y-16">
        {/* Color Palette */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Color Palette</h2>

          {/* Primary Surfaces */}
          <div className="mb-8">
            <h3 className="font-sans text-lg font-medium mb-4 text-muted-foreground">Primary Surfaces</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Ink" varName="--ink" hex="#09090B" description="Deep black backgrounds" />
              <ColorSwatch name="Paper" varName="--paper" hex="#FAFAFA" description="Off-white surfaces" />
            </div>
          </div>

          {/* Brand Colors */}
          <div className="mb-8">
            <h3 className="font-sans text-lg font-medium mb-4 text-muted-foreground">Brand Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Coral" varName="--coral" hex="#FF6B35" description="Primary accent (10%)" />
              <ColorSwatch name="Teal" varName="--teal" hex="#00A896" description="Secondary accent (5%)" />
            </div>
          </div>

          {/* Brutalist Accents */}
          <div>
            <h3 className="font-sans text-lg font-medium mb-4 text-muted-foreground">Brutalist Accents</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch name="Acid" varName="--acid" hex="#CCFF00" description="Kinetic elements (2%)" darkText />
              <ColorSwatch name="Electric" varName="--electric" hex="#8B5CF6" description="Hover states" darkText />
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Typography</h2>

          <div className="space-y-6">
            <TypeSample family="dela" text="Dela" size="text-4xl md:text-5xl" description="Display headlines, hero text" />
            <TypeSample family="display" text="Geist Display" size="text-3xl" description="Section headings, subheadings" />
            <TypeSample family="sans" text="System UI Sans" size="text-xl" description="Body text, UI elements" />
            <TypeSample family="mono" text="IBM Plex Mono" size="text-lg" description="Code, data, technical" />
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Buttons</h2>

          <div className="space-y-8">
            <div>
              <h3 className="font-sans text-sm font-medium text-muted-foreground mb-4">Standard Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div>
              <h3 className="font-sans text-sm font-medium text-muted-foreground mb-4">Brutalist Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="brutalist">Brutalist</Button>
                <Button variant="brutalist-ghost">Brutalist Ghost</Button>
                <Button variant="brutalist-rounded">Brutalist Rounded</Button>
                <Button variant="brutalist-ghost-rounded">Brutalist Ghost Rounded</Button>
              </div>
            </div>

            <div>
              <h3 className="font-sans text-sm font-medium text-muted-foreground mb-4">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            <div>
              <h3 className="font-sans text-sm font-medium text-muted-foreground mb-4">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button variant="primary" leftIcon={<span>→</span>}>With Icon</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Cards</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>shadcn/ui base component</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Clean, refined aesthetic with subtle shadows and rounded corners.</p>
              </CardContent>
            </Card>

            <div className="brutalist-card p-6">
              <h3 className="font-bold text-lg mb-2">Brutalist Card</h3>
              <p className="text-sm">Hard borders, hard shadows, no blur. Pure brutalist aesthetic.</p>
            </div>

            <div className="clean-card p-6">
              <h3 className="font-semibold text-lg mb-2">Clean Card</h3>
              <p className="text-sm text-muted-foreground">Subtle shadow with hover lift effect. Minimal border.</p>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Badges</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-sans text-sm font-medium text-muted-foreground mb-4">Status Badges</h3>
              <div className="flex flex-wrap gap-3">
                <StatusBadge badgeVariant="success">Connected</StatusBadge>
                <StatusBadge status="pending" />
                <StatusBadge status="invalid" />
                <StatusBadge badgeVariant="warning">Warning</StatusBadge>
                <StatusBadge badgeVariant="default">Info</StatusBadge>
              </div>
            </div>

            <div>
              <h3 className="font-sans text-sm font-medium text-muted-foreground mb-4">Health Badges</h3>
              <div className="flex flex-wrap gap-3">
                <HealthBadge health="healthy" />
                <HealthBadge health="expiring" />
                <HealthBadge health="expired" />
                <HealthBadge health="unknown" />
              </div>
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Shadows</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <ShadowSample level="sm" />
            <ShadowSample level="md" />
            <ShadowSample level="lg" />
            <ShadowSample level="xl" />
            <ShadowSample level="2xl" />
            <ShadowSample level="3xl" />
          </div>
        </section>

        {/* Platform Icons */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Platform Icons</h2>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center gap-2 p-4">
              <PlatformIcon platform="meta" size="md" />
              <span className="text-xs text-muted-foreground">Meta</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <PlatformIcon platform="google" size="md" />
              <span className="text-xs text-muted-foreground">Google</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <PlatformIcon platform="linkedin" size="md" />
              <span className="text-xs text-muted-foreground">LinkedIn</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <PlatformIcon platform="tiktok" size="md" />
              <span className="text-xs text-muted-foreground">TikTok</span>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Spacing</h2>

          <div className="space-y-3">
            <SpacingSample value="0" px="0px" />
            <SpacingSample value="1" px="4px" />
            <SpacingSample value="2" px="8px" />
            <SpacingSample value="3" px="12px" />
            <SpacingSample value="4" px="16px" />
            <SpacingSample value="6" px="24px" />
            <SpacingSample value="8" px="32px" />
            <SpacingSample value="12" px="48px" />
            <SpacingSample value="16" px="64px" />
          </div>
        </section>

        {/* Border Radius */}
        <section>
          <h2 className="font-display text-3xl font-semibold mb-6">Border Radius</h2>

          <div className="flex flex-wrap gap-6">
            <RadiusSample value="none" label="None (Brutalist)" />
            <RadiusSample value="lg" label="Large (Default)" />
            <RadiusSample value="xl" label="Extra Large" />
            <RadiusSample value="2xl" label="2X Large" />
            <RadiusSample value="full" label="Full" />
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorSwatch({
  name,
  varName,
  hex,
  description,
  darkText = false
}: {
  name: string;
  varName: string;
  hex: string;
  description: string;
  darkText?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div
        className="h-24 w-full border-2 border-border shadow-sm"
        style={{ backgroundColor: hex }}
      />
      <div className="space-y-0.5">
        <p className={`font-medium ${darkText ? 'text-black' : 'text-foreground'}`}>{name}</p>
        <p className="text-xs font-mono text-muted-foreground">{varName}</p>
        <p className="text-xs text-muted-foreground">{hex}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TypeSample({
  family,
  text,
  size,
  description
}: {
  family: string;
  text: string;
  size: string;
  description: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-baseline gap-4 p-4 border border-border">
      <span className={`font-${family} ${size} min-w-[200px]`}>{text}</span>
      <span className="text-sm text-muted-foreground font-sans">{description}</span>
    </div>
  );
}

function ShadowSample({ level }: { level: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' }) {
  return (
    <div className="space-y-2 text-center">
      <div
        className={`h-20 w-full bg-ink shadow-brutalist-${level}`}
      />
      <p className="text-xs font-mono text-muted-foreground">shadow-brutalist-{level}</p>
    </div>
  );
}

function SpacingSample({ value, px }: { value: string, px: string }) {
  return (
    <div className="flex items-center gap-4">
      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">spacing-{value}</code>
      <div className="h-8 bg-acid/30 border border-black" style={{ width: px }} />
      <span className="text-xs text-muted-foreground">{px}</span>
    </div>
  );
}

function RadiusSample({ value, label }: { value: string, label: string }) {
  return (
    <div className="space-y-2 text-center">
      <div
        className={`h-16 w-16 bg-coral border-2 border-black rounded-${value}`}
      />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
