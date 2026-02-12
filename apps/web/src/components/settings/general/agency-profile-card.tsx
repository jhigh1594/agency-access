'use client';

/**
 * Agency Profile Card
 *
 * Form for agency name, website, and logo.
 */

import { useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AgencyProfileCard() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <section className="clean-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-coral/10 rounded-lg">
          <Building2 className="h-5 w-5 text-coral" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Agency Profile</h2>
          <p className="text-sm text-muted-foreground">Update your agency information</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Agency Name
          </label>
          <input
            type="text"
            placeholder="Your Agency Name"
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Company Website
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Logo URL
          </label>
          <input
            type="url"
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used for client-facing pages and branding
          </p>
        </div>

        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </section>
  );
}
