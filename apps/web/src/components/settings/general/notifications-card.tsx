'use client';

/**
 * Notifications Card
 * 
 * Notification preferences form.
 */

import { useState } from 'react';
import { Bell, Save } from 'lucide-react';

export function NotificationsCard() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <Bell className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-600">Configure email and in-app notifications</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">
              Access request notifications
            </p>
            <p className="text-xs text-slate-600">
              Get notified when clients complete authorization
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Token expiration alerts</p>
            <p className="text-xs text-slate-600">
              Get notified when tokens are about to expire
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Weekly summary</p>
            <p className="text-xs text-slate-600">
              Receive a weekly summary of activity
            </p>
          </div>
        </label>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </section>
  );
}
