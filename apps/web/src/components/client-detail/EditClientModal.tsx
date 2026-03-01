'use client';

/**
 * EditClientModal Component
 *
 * Modal form for editing client information.
 * Allows editing name, company, website, and language.
 * Email is read-only since it's the unique identifier.
 */

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClientLanguage } from '@agency-platform/shared';
import { Button } from '@/components/ui';

interface EditClientModalProps {
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
  onClose: () => void;
}

export function EditClientModal({ client, onClose }: EditClientModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(client.name);
  const [company, setCompany] = useState(client.company);
  const [website, setWebsite] = useState(client.website || '');
  const [language, setLanguage] = useState<ClientLanguage>(client.language as ClientLanguage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; company: string; website?: string; language: ClientLanguage }) => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update client');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch client detail query
      queryClient.invalidateQueries({ queryKey: ['client-detail', client.id] });
      // Also invalidate clients list query
      queryClient.invalidateQueries({ queryKey: ['clients-with-connections'] });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Name is required');
      return;
    }
    if (!company.trim()) {
      setErrorMessage('Company is required');
      return;
    }

    // Update client
    updateMutation.mutate({
      name: name.trim(),
      company: company.trim(),
      website: website.trim() || undefined,
      language,
    });
  };

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <m.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-lg shadow-brutalist max-w-md w-full border border-black/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
            <h2 className="text-lg font-semibold text-ink font-display">Edit Client</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Name <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Client contact name"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Company <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Company name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={client.email}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted/20 text-muted-foreground cursor-not-allowed"
                title="Email cannot be changed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as ClientLanguage)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="nl">🇳🇱 Nederlands</option>
              </select>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-coral/10 border border-coral rounded-lg">
                <p className="text-sm text-coral">{errorMessage}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="p-3 bg-teal/10 border border-teal rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal flex-shrink-0" />
                <p className="text-sm text-teal">Client updated successfully</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
              <Button
                type="button"
                onClick={onClose}
                disabled={updateMutation.isPending}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                size="sm"
                leftIcon={!updateMutation.isPending ? undefined : <Loader2 className="h-4 w-4 animate-spin" />}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
