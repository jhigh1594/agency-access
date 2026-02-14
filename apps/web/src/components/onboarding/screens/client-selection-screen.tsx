/**
 * Client Selection Screen (Screen 2A)
 *
 * Step 2 of the unified onboarding flow.
 * Purpose: Create the first access request - this is the CORE aha moment.
 *
 * Key Elements:
 * - Simple client selection (typeahead with existing clients)
 * - Pre-selected platforms shown as "most popular"
 * - Clear "why this matters" microcopy
 * - Continue button requires valid client
 *
 * Design Principles:
 * - Interactive: Users CREATE something valuable immediately
 * - Fast: Can complete in 20-30 seconds
 * - Clear: Users know exactly what they're creating
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Client } from '@agency-platform/shared';
import { OpinionatedInput } from '../opinionated-input';
import { fadeVariants, fadeTransition } from '@/lib/animations';

// ============================================================
// TYPES
// ============================================================

interface ClientSelectionScreenProps {
  clientName: string;
  clientEmail: string;
  existingClients: Client[];
  loading: boolean;
  onUpdate: (data: { id?: string; name: string; email: string }) => void;
  onLoadClients: () => Promise<void>;
}

// ============================================================
// COMPONENT
// ============================================================

export function ClientSelectionScreen({
  clientName,
  clientEmail,
  existingClients,
  loading,
  onUpdate,
  onLoadClients,
}: ClientSelectionScreenProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load existing clients on mount
  useEffect(() => {
    onLoadClients();
  }, [onLoadClients]);

  // Get client suggestions for typeahead
  const clientSuggestions = existingClients.map((c) => c.name);

  // Handle selecting an existing client
  const handleSelectClient = useCallback(
    (client: Client) => {
      setSelectedClientId(client.id);
      onUpdate({
        id: client.id,
        name: client.name,
        email: client.email,
      });
      setIsCreatingNew(false);
    },
    [onUpdate]
  );

  // Handle creating a new client
  const handleCreateNew = useCallback(() => {
    setSelectedClientId(null);
    setIsCreatingNew(true);
  }, []);

  // Validate client input
  const isValidClient = useCallback(() => {
    return (
      clientName.trim().length >= 2 &&
      clientEmail.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)
    );
  }, [clientName, clientEmail]);

  // Filter existing clients by search
  const [searchQuery, setSearchQuery] = useState('');
  const filteredClients = existingClients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="p-8 md:p-12"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={fadeTransition}
    >
      {/* Step Header */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-indigo-600 mb-2">Step 2 of 6</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your first access request</h2>
        <p className="text-gray-600">
          This is how you'll get client OAuth tokens in under 2 minutes.
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Existing Clients Section */}
        {existingClients.length > 0 && !isCreatingNew && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Select an existing client
            </label>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Client List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredClients.map((client) => (
                <motion.button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all
                    ${selectedClientId === client.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-card'
                    }
                  `}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                    {selectedClientId === client.id && (
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Create New Button */}
            <button
              type="button"
              onClick={handleCreateNew}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Create a new client instead
            </button>
          </div>
        )}

        {/* Create New Client Form */}
        {(existingClients.length === 0 || isCreatingNew) && (
          <div className="space-y-4">
            {existingClients.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← Back to client list
              </button>
            )}

            <OpinionatedInput
              label="Client Name"
              value={clientName}
              onChange={(name) => onUpdate({ name, email: clientEmail })}
              placeholder="e.g., Acme Corp"
              type="text"
              required
              helperText="The company or client name"
              validationMessage="Please enter a client name (at least 2 characters)"
              isValid={clientName.trim().length >= 2}
              suggestions={clientSuggestions}
            />

            <OpinionatedInput
              label="Client Email"
              value={clientEmail}
              onChange={(email) => onUpdate({ name: clientName, email })}
              placeholder="client@acmecorp.com"
              type="email"
              required
              helperText="We'll send the access link to this email"
              validationMessage="Please enter a valid email address"
              isValid={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)}
            />
          </div>
        )}

        {/* Insight Box */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1 text-sm text-green-900">
              <span className="font-semibold">Why this matters:</span>{' '}
              After you create this access request, you'll get a unique link that your client can use to authorize all their platforms in one go. No more back-and-forth emails!
            </div>
          </div>
        </div>

        {/* Next Step Teaser */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Next: Choose Platforms</h3>
          <p className="text-sm text-gray-600">
            We'll select which platforms this client needs to authorize. Google Ads and Meta Ads are pre-selected (most agencies start with these).
          </p>
        </div>
      </div>
    </motion.div>
  );
}
