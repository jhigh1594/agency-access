/**
 * Meta Page Permissions Modal Component
 *
 * Modal for selecting specific Meta Page permissions when limiting access.
 * Shows all available page permissions with checkboxes for granular control.
 */

'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Facebook, Loader2 } from 'lucide-react';
import type { MetaPagePermission } from '@agency-platform/shared';
import { Button } from './ui/button';

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
      <m.div
        key="meta-page-permissions-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <m.div
        key="meta-page-permissions-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.15rem] border-2 border-black bg-card shadow-brutalist-lg pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border bg-paper px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  Page permissions
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-11 rounded-full border border-black transition-colors ${allSelected ? 'bg-teal' : 'bg-border'}`}>
                    <div className={`mt-0.5 ml-0.5 h-5 w-5 rounded-full bg-card transition-transform ${allSelected ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <Facebook className="h-5 w-5 text-coral" />
                  <span className="text-lg font-semibold text-ink">
                    Page {allSelected ? '(all permissions)' : '(selected permissions only)'}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="brutalist-ghost-rounded"
                size="icon"
                onClick={onClose}
                disabled={isSaving}
                aria-label="Close modal"
                className="h-11 w-11 min-h-[44px] shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Request Maximum Permissions Link */}
          {!allSelected && (
            <div className="border-b border-border bg-coral/10 px-6 py-3">
              <Button
                type="button"
                onClick={handleRequestMaximum}
                variant="ghost"
                size="sm"
                className="px-0 text-coral hover:bg-transparent hover:text-coral"
                disabled={isSaving}
              >
                Request maximum permissions
              </Button>
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
                    className={`rounded-[1rem] border p-4 transition-all ${
                      isChecked
                        ? 'border-coral bg-coral/10 shadow-brutalist-sm'
                        : 'border-border bg-paper hover:border-black'
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
                        <div className="text-sm font-medium text-ink">
                          {permission.label}
                        </div>
                        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
          <div className="border-t border-border bg-paper px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {localPermissions.length === 0
                  ? 'No permissions selected'
                  : `${localPermissions.length} permission${localPermissions.length !== 1 ? 's' : ''} selected`}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  variant="brutalist-ghost-rounded"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || localPermissions.length === 0}
                  variant="brutalist-rounded"
                  size="sm"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
