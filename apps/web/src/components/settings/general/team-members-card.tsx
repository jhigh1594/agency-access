'use client';

/**
 * Team Members Card
 * 
 * Placeholder for team management feature.
 */

import { Users } from 'lucide-react';

export function TeamMembersCard() {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
          <p className="text-sm text-slate-600">Manage your team and permissions</p>
        </div>
      </div>

      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
        <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-600 mb-4">Team management coming soon</p>
        <p className="text-sm text-slate-500">
          Invite team members and manage their roles
        </p>
      </div>
    </section>
  );
}
