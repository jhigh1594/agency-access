'use client';

/**
 * Notifications Card
 *
 * Notification preferences form.
 */

import { useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationsCard() {
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
          <Bell className="h-5 w-5 text-coral" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Notifications</h2>
          <p className="text-sm text-muted-foreground">Configure email and in-app notifications</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 text-coral border-input rounded focus:ring-coral"
          />
          <div>
            <p className="text-sm font-medium text-ink">
              Access request notifications
            </p>
            <p className="text-xs text-muted-foreground">
              Get notified when clients complete authorization
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 text-coral border-input rounded focus:ring-coral"
          />
          <div>
            <p className="text-sm font-medium text-ink">Token expiration alerts</p>
            <p className="text-xs text-muted-foreground">
              Get notified when tokens are about to expire
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-coral border-input rounded focus:ring-coral"
          />
          <div>
            <p className="text-sm font-medium text-ink">Weekly summary</p>
            <p className="text-xs text-muted-foreground">
              Receive a weekly summary of activity
            </p>
          </div>
        </label>

        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </section>
  );
}
