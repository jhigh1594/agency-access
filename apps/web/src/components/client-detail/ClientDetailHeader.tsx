'use client';

/**
 * ClientDetailHeader Component
 *
 * Displays client profile information with action buttons.
 * Shows client avatar, name, company, email, client since date,
 * and status badge. Includes Edit and Delete action buttons.
 */

import { useState } from 'react';
import { User, Mail, Building2, Calendar, Edit, Trash2, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/ui';
import type { Client, ClientLanguage } from '@agency-platform/shared';
import { EditClientModal } from './EditClientModal';
import { DeleteClientModal } from './DeleteClientModal';

interface ClientDetailHeaderProps {
  client: {
    id: string;
    name: string;
    company: string;
    email: string;
    website: string | null;
    language: ClientLanguage;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function ClientDetailHeader({ client }: ClientDetailHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Get initials from name
  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format client since date
  const clientSince = new Date(client.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Determine client status based on activity
  // For now, all clients are considered "active" - this could be enhanced
  // to check for active connections
  const status = 'active' as const;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          {/* Left side: Avatar and info */}
          <div className="flex items-start space-x-4 flex-1">
            {/* Avatar */}
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-semibold text-indigo-700">
                {initials}
              </span>
            </div>

            {/* Client info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-slate-900">
                  {client.name}
                </h1>
                <StatusBadge status={status} size="md" />
              </div>

              <div className="space-y-1">
                {/* Company */}
                <div className="flex items-center text-sm text-slate-600">
                  <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">{client.company}</span>
                </div>

                {/* Email */}
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{client.email}</span>
                </div>

                {/* Client since */}
                <div className="flex items-center text-sm text-slate-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Client since {clientSince}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteClientModal
          client={client}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
