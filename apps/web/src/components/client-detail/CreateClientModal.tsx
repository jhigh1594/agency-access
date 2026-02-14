'use client';

/**
 * CreateClientModal Component
 *
 * Modal form for creating a new client.
 * Allows entering name, company, email, website, and language.
 */

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, Plus } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClientLanguage } from '@agency-platform/shared';

interface CreateClientModalProps {
  onClose: () => void;
  onSuccess?: (client: { id: string; name: string; email: string }) => void;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// URL validation regex (simple)
const URL_REGEX = /^https?:\/\/.+/;

export function CreateClientModal({ onClose, onSuccess }: CreateClientModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [language, setLanguage] = useState<ClientLanguage>('en');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Create client mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      company: string;
      email: string;
      website?: string;
      language: ClientLanguage;
    }) => {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create client');
      }

      return response.json();
    },
    onSuccess: (result) => {
      // Invalidate clients list query
      queryClient.invalidateQueries({ queryKey: ['clients-with-connections'] });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.(result.data);
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
    if (!email.trim()) {
      setErrorMessage('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (website.trim() && !URL_REGEX.test(website.trim())) {
      setErrorMessage('Website must be a valid URL (e.g., https://example.com)');
      return;
    }

    // Create client
    createMutation.mutate({
      name: name.trim(),
      company: company.trim(),
      email: email.trim().toLowerCase(),
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
          className="bg-card rounded-lg shadow-brutalist max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-acid/20 rounded-lg">
                <Plus className="h-4 w-4 text-acid" />
              </div>
              <h2 className="text-lg font-semibold text-ink">Create Client</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-acid focus:border-transparent"
                placeholder="Client contact name"
                disabled={createMutation.isPending}
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-acid focus:border-transparent"
                placeholder="Company name"
                disabled={createMutation.isPending}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-coral">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-acid focus:border-transparent"
                placeholder="client@company.com"
                disabled={createMutation.isPending}
              />
              <p className="text-xs text-gray-500 mt-1">Used for client authentication</p>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-acid focus:border-transparent"
                placeholder="https://example.com"
                disabled={createMutation.isPending}
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as ClientLanguage)}
                className="w-full px-3 py-2 border-2 border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-acid focus:border-transparent"
                disabled={createMutation.isPending}
              >
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🸸 Español</option>
                <option value="nl">🇳🇱 Nederlands</option>
              </select>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-coral/10 border border-coral rounded-lg">
                <p className="text-sm text-coral-90">{errorMessage}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="p-3 bg-teal/10 border border-teal rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal flex-shrink-0" />
                <p className="text-sm text-teal">Client created successfully</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-black/10">
              <button
                type="button"
                onClick={onClose}
                disabled={createMutation.isPending}
                className="px-4 py-2 border-2 border-black text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Client
                  </>
                )}
              </button>
            </div>
          </form>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
