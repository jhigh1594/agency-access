/**
 * Meta Page Permissions Modal Component
 *
 * Modal for selecting specific Meta Page permissions when limiting access.
 * Shows all available page permissions with checkboxes for granular control.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Facebook, Loader2 } from 'lucide-react';
import type { MetaPagePermission } from '@agency-platform/shared';

export interface MetaPagePermissionOption {
  id: MetaPagePermission;
  label: string;
  description: string;
}

export const META_PAGE_PERMISSIONS: MetaPagePermissionOption[] = [
  {
    id: 'content',
    label: 'Content',
    description: 'Create, manage or delete posts, stories and more as the Page.',
  },
  {
    id: 'community_activity',
    label: 'Community activity',
    description: 'Review and respond to comments, remove unwanted content and report activity.',
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Send and respond to messages as the Page.',
  },
  {
    id: 'ads',
    label: 'Ads',
    description: 'Create, manage and delete ads for the Page.',
  },
  {
    id: 'insights',
    label: 'Insights',
    description: 'See how the Page, content and ads perform.',
  },
  {
    id: 'revenue',
    label: 'Revenue',
    description: 'View and export Page monetisation and earnings data.',
  },
  {
    id: 'leads',
    label: 'Leads',
    description: 'Access and manage leads, including downloading leads, creating lead ads and more.',
  },
  {
    id: 'partial_access',
    label: 'Partial access (business tools and Facebook)',
    description: 'Switch into the page to manage things directly on Facebook, and by using tools like Meta Business Suite. System users can\'t switch into the Page or do some sensitive tasks.',
  },
  {
    id: 'maximum_permissions',
    label: 'Maximum permissions',
    description: 'All available permissions',
  },
];

interface MetaPagePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPermissions: MetaPagePermission[];
  onSave: (permissions: MetaPagePermission[]) => void;
  isSaving?: boolean;
}

export function MetaPagePermissionsModal({
  isOpen,
  onClose,
  selectedPermissions,
  onSave,
  isSaving = false,
}: MetaPagePermissionsModalProps) {
  const [localPermissions, setLocalPermissions] = useState<MetaPagePermission[]>(selectedPermissions);

  // Sync local state when selectedPermissions prop changes
  useEffect(() => {
    setLocalPermissions(selectedPermissions);
  }, [selectedPermissions]);

  const handleTogglePermission = (permissionId: MetaPagePermission) => {
    if (permissionId === 'maximum_permissions') {
      // If maximum permissions is selected, select all
      if (localPermissions.includes('maximum_permissions')) {
        setLocalPermissions([]);
      } else {
        setLocalPermissions(META_PAGE_PERMISSIONS.map(p => p.id));
      }
    } else {
      // Toggle individual permission
      if (localPermissions.includes(permissionId)) {
        setLocalPermissions(localPermissions.filter(p => p !== permissionId && p !== 'maximum_permissions'));
      } else {
        const newPermissions = [...localPermissions, permissionId];
        // If all other permissions are selected, also select maximum_permissions
        const otherPermissions = META_PAGE_PERMISSIONS.filter(p => p.id !== 'maximum_permissions').map(p => p.id);
        if (otherPermissions.every(p => newPermissions.includes(p))) {
          newPermissions.push('maximum_permissions');
        }
        setLocalPermissions(newPermissions);
      }
    }
  };

  const handleRequestMaximum = () => {
    setLocalPermissions(META_PAGE_PERMISSIONS.map(p => p.id));
  };

  const handleSave = () => {
    onSave(localPermissions);
  };

  const allSelected = localPermissions.length === META_PAGE_PERMISSIONS.length;
  const hasMaximumPermissions = localPermissions.includes('maximum_permissions');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="meta-page-permissions-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="meta-page-permissions-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative bg-card rounded-lg shadow-brutalist-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-card">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`h-6 w-11 rounded-full transition-colors ${allSelected ? 'bg-teal' : 'bg-gray-300'}`}>
                  <div className={`h-5 w-5 rounded-full bg-card mt-0.5 ml-0.5 transition-transform ${allSelected ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <Facebook className="h-5 w-5 text-coral" />
                <span className="text-lg font-semibold text-ink">
                  Page {allSelected ? '(all permissions)' : '(selected permissions only)'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Request Maximum Permissions Link */}
          {!allSelected && (
            <div className="px-6 py-3 bg-coral/10 border-b border-coral">
              <button
                onClick={handleRequestMaximum}
                className="text-sm text-coral font-medium hover:underline"
                disabled={isSaving}
              >
                Request maximum permissions
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              {META_PAGE_PERMISSIONS.map((permission) => {
                const isChecked = localPermissions.includes(permission.id);
                const isMaximumPermissions = permission.id === 'maximum_permissions';

                return (
                  <div
                    key={permission.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isChecked
                        ? 'bg-coral/10 border-coral'
                        : 'bg-card border-black/10 hover:border-black'
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(permission.id)}
                        disabled={isSaving}
                        className="mt-1 h-4 w-4 rounded border-2 border-black text-coral focus:ring-coral cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${isChecked ? 'text-ink' : 'text-gray-700'}`}>
                          {permission.label}
                        </div>
                        <div className={`text-xs mt-1 leading-relaxed ${isChecked ? 'text-gray-600' : 'text-gray-500'}`}>
                          {permission.description}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-black/10 bg-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                {localPermissions.length === 0
                  ? 'No permissions selected'
                  : `${localPermissions.length} permission${localPermissions.length !== 1 ? 's' : ''} selected`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 border-2 border-black rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || localPermissions.length === 0}
                  className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

