'use client';

/**
 * Settings Page
 *
 * General agency settings and preferences.
 * Sections: Agency Profile, Team Members, Notifications, API Keys
 */

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Settings as SettingsIcon, Users, Bell, Key, Building2, Save } from 'lucide-react';

export default function SettingsPage() {
  const { orgId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (section: string) => {
    setIsSaving(true);
    // TODO: Implement save functionality
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your agency settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Agency Profile Section */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Agency Profile</h2>
                <p className="text-sm text-slate-600">Update your agency information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Agency Name
                </label>
                <input
                  type="text"
                  placeholder="Your Agency Name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Website
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used for client-facing pages and branding
                </p>
              </div>

              <button
                onClick={() => handleSave('profile')}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>

          {/* Team Members Section */}
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

          {/* Notifications Section */}
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
                onClick={() => handleSave('notifications')}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </section>

          {/* API Keys Section */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Key className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">API Keys</h2>
                <p className="text-sm text-slate-600">Manage API keys for programmatic access</p>
              </div>
            </div>

            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
              <Key className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 mb-4">API access coming soon</p>
              <p className="text-sm text-slate-500">
                Generate API keys for integrating with your systems
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
