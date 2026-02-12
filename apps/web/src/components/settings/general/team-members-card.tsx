'use client';

/**
 * Team Members Card
 *
 * Placeholder for team management feature.
 */

import { Users } from 'lucide-react';

export function TeamMembersCard() {
  return (
    <section className="clean-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-coral/10 rounded-lg">
          <Users className="h-5 w-5 text-coral" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Team Members</h2>
          <p className="text-sm text-muted-foreground">Manage your team and permissions</p>
        </div>
      </div>

      <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-foreground mb-4">Team management coming soon</p>
        <p className="text-sm text-muted-foreground">
          Invite team members and manage their roles
        </p>
      </div>
    </section>
  );
}
