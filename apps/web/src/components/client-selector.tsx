/**
 * ClientSelector Component
 *
 * Phase 5: Searchable client selector with inline client creation.
 * Part of Enhanced Access Request Creation.
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2, AlertCircle, Check, Globe } from 'lucide-react';
import { Client, ClientLanguage } from '@agency-platform/shared';

const SUPPORTED_LANGUAGES: Record<ClientLanguage, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  es: { name: 'Español', flag: '🇪🇸' },
  nl: { name: 'Nederlands', flag: '🇳🇱' },
};

interface ClientSelectorProps {
  agencyId: string;
  onSelect: (client: Client) => void;
  value?: string;
}

interface PaginatedClientsResponse {
  data: Client[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export function ClientSelector({ agencyId, onSelect, value }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  // New client form state
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    language: 'en' as ClientLanguage,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // Load clients
  useEffect(() => {
    loadClients();
  }, [searchQuery]);

  const loadClients = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '50');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients?${params.toString()}`,
        {
          headers: {
            'x-agency-id': agencyId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load clients');
      }

      const json = await response.json();
      // Handle new format: { data: { data: Client[], pagination: {...} } }
      const result: PaginatedClientsResponse = 'data' in json ? json.data : json;
      setClients(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    onSelect(client);
  };

  const handleCreateClient = async () => {
    setFormErrors({});

    // Validate
    const errors: Record<string, string> = {};
    if (!newClient.name.trim()) errors.name = 'Name is required';
    if (!newClient.company.trim()) errors.company = 'Company is required';
    if (!newClient.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) errors.email = 'Invalid email format';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'x-agency-id': agencyId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      if (!response.ok) {
        const data = await response.json();
        // Handle both old format (errorCode) and new format (error.code)
        const errorCode = data.errorCode || data.error?.code;
        if (errorCode === 'CLIENT_EMAIL_EXISTS' || errorCode === 'EMAIL_EXISTS') {
          errors.email = 'A client with this email already exists';
          setFormErrors(errors);
          return;
        }
        throw new Error('Failed to create client');
      }

      const json = await response.json();
      // Handle both formats: { data: client } and direct client object
      const createdClient: Client = 'data' in json ? json.data : json;
      setShowNewClientForm(false);
      setNewClient({ name: '', company: '', email: '', language: 'en' });
      onSelect(createdClient);
      loadClients(); // Refresh client list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelNewClient = () => {
    setShowNewClientForm(false);
    setNewClient({ name: '', company: '', email: '', language: 'en' });
    setFormErrors({});
  };

  return (
    <div className="space-y-4">
      {!showNewClientForm ? (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search clients"
              tabIndex={-1}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Add New Client Button */}
          <button
            type="button"
            onClick={() => setShowNewClientForm(true)}
            tabIndex={-1}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add new client
          </button>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
              <span className="text-slate-600">Loading clients...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-slate-600">Failed to load clients</p>
              <button
                type="button"
                onClick={loadClients}
                className="px-4 py-2 text-indigo-600 hover:text-indigo-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (clients?.length ?? 0) === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-slate-600">No clients found</p>
              <p className="text-sm text-slate-500">
                {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
              </p>
            </div>
          )}

          {/* Client List */}
          {!loading && !error && (clients?.length ?? 0) > 0 && (
            <div className="space-y-2" role="listbox" aria-label="Clients">
              {clients?.map((client) => {
                const isSelected = value === client.id;
                return (
                  <button
                    key={client.id}
                    type="button"
                    role="button"
                    onClick={() => handleSelectClient(client)}
                    className={`w-full text-left px-4 py-3 border rounded-lg transition-colors flex items-center gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    aria-selected={isSelected}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{client.name}</p>
                      <p className="text-sm text-slate-600">{client.company}</p>
                      <p className="text-xs text-slate-500 mt-1">{client.email}</p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-indigo-600" />
                    )}
                    {client.language !== 'en' && (
                      <span className="text-xs" title={SUPPORTED_LANGUAGES[client.language].name}>
                        {SUPPORTED_LANGUAGES[client.language].flag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* New Client Form */
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Create new client</h3>
            <button
              type="button"
              onClick={handleCancelNewClient}
              className="p-1 text-slate-400 hover:text-slate-600"
              aria-label="Close form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium text-slate-700 mb-1">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="client-name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.name ? 'border-red-300' : 'border-slate-300'
                }`}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
              />
              {formErrors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Company */}
            <div>
              <label htmlFor="client-company" className="block text-sm font-medium text-slate-700 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="client-company"
                value={newClient.company}
                onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.company ? 'border-red-300' : 'border-slate-300'
                }`}
                aria-invalid={!!formErrors.company}
                aria-describedby={formErrors.company ? 'company-error' : undefined}
              />
              {formErrors.company && (
                <p id="company-error" className="mt-1 text-sm text-red-600">
                  {formErrors.company}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="client-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="client-email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.email ? 'border-red-300' : 'border-slate-300'
                }`}
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Language */}
            <div>
              <label htmlFor="client-language" className="block text-sm font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Language
                </span>
              </label>
              <select
                id="client-language"
                value={newClient.language}
                onChange={(e) => setNewClient({ ...newClient, language: e.target.value as ClientLanguage })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => (
                  <option key={code} value={code}>
                    {flag} {name}
                  </option>
                ))}
              </select>
            </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancelNewClient}
              disabled={creating}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateClient}
              disabled={creating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Client
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
