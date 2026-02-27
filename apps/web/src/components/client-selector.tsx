/**
 * ClientSelector Component
 *
 * Phase 5: Searchable client selector with inline client creation.
 * Part of Enhanced Access Request Creation.
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2, AlertCircle, Check, Globe } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { Client, ClientLanguage } from '@agency-platform/shared';
import { useAuthOrBypass } from '@/lib/dev-auth';

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
  const clerkAuth = useAuth();
  const { getToken } = clerkAuth;
  const auth = useAuthOrBypass(clerkAuth);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');

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
      const token = await getToken();
      if (!token && !auth.isDevelopmentBypass) throw new Error('No auth token');
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '50');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      const token = await getToken();
      if (!token && !auth.isDevelopmentBypass) throw new Error('No auth token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
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
      setActiveTab('existing'); // Switch back to existing tab
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
    setActiveTab('existing');
    setNewClient({ name: '', company: '', email: '', language: 'en' });
    setFormErrors({});
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('existing')}
          className={`flex-1 px-5 py-3.5 text-base font-medium transition-colors border-b-2 ${
            activeTab === 'existing'
              ? 'text-coral border-coral bg-coral/10'
              : 'text-muted-foreground border-transparent hover:text-ink hover:bg-muted/20'
          }`}
        >
          Existing Clients
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`flex-1 px-5 py-3.5 text-base font-medium transition-colors border-b-2 ${
            activeTab === 'new'
              ? 'text-coral border-coral bg-coral/10'
              : 'text-muted-foreground border-transparent hover:text-ink hover:bg-muted/20'
          }`}
        >
          Create New
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === 'existing' ? (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search existing clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search clients"
                className="w-full pl-11 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-coral text-base"
              />
            </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-10" role="status" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin text-coral mr-2" />
              <span className="text-muted-foreground text-base">Loading clients...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="h-9 w-9 text-coral" />
              <p className="text-muted-foreground text-base">Failed to load clients</p>
              <button
                type="button"
                onClick={loadClients}
                className="px-5 py-2.5 text-coral hover:text-coral/90 text-base rounded-lg hover:bg-muted/20 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (clients?.length ?? 0) === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-muted-foreground text-base">No clients found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
              </p>
            </div>
          )}

          {/* Client List */}
          {!loading && !error && (clients?.length ?? 0) > 0 && (
            <div className="space-y-2" role="listbox" aria-label="Clients">
              {clients?.map((client) => {
                const isSelected = value === client.id;
                const languageInfo = client.language && SUPPORTED_LANGUAGES[client.language];
                return (
                  <button
                    key={client.id}
                    type="button"
                    role="button"
                    onClick={() => handleSelectClient(client)}
                    className={`w-full text-left px-4 py-3.5 border rounded-lg transition-colors flex items-center gap-3 ${
                      isSelected
                        ? 'border-coral bg-coral/10'
                        : 'border-border hover:border-border hover:bg-muted/20'
                    }`}
                    aria-selected={isSelected}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-ink text-base">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                      <p className="text-xs text-muted-foreground mt-1">{client.email}</p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-coral" />
                    )}
                    {languageInfo && client.language !== 'en' && (
                      <span className="text-sm" title={languageInfo.name}>
                        {languageInfo.flag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          </div>
        ) : (
          /* New Client Form */
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Create new client</h3>
              <button
                type="button"
                onClick={handleCancelNewClient}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-coral/10 border border-coral/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-coral flex-shrink-0 mt-0.5" />
                <p className="text-base text-coral">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium text-foreground mb-1.5">
                Client Name <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                id="client-name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-ring focus:border-coral text-base ${
                  formErrors.name ? 'border-coral/50' : 'border-border'
                }`}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
              />
              {formErrors.name && (
                <p id="name-error" className="mt-1.5 text-sm text-coral">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Company */}
            <div>
              <label htmlFor="client-company" className="block text-sm font-medium text-foreground mb-1.5">
                Company <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                id="client-company"
                value={newClient.company}
                onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-ring focus:border-coral text-base ${
                  formErrors.company ? 'border-coral/50' : 'border-border'
                }`}
                aria-invalid={!!formErrors.company}
                aria-describedby={formErrors.company ? 'company-error' : undefined}
              />
              {formErrors.company && (
                <p id="company-error" className="mt-1.5 text-sm text-coral">
                  {formErrors.company}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="client-email" className="block text-sm font-medium text-foreground mb-1.5">
                Email <span className="text-coral">*</span>
              </label>
              <input
                type="email"
                id="client-email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-ring focus:border-coral text-base ${
                  formErrors.email ? 'border-coral/50' : 'border-border'
                }`}
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="mt-1.5 text-sm text-coral">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Language */}
            <div>
              <label htmlFor="client-language" className="block text-sm font-medium text-foreground mb-1.5">
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Language
                </span>
              </label>
              <select
                id="client-language"
                value={newClient.language}
                onChange={(e) => setNewClient({ ...newClient, language: e.target.value as ClientLanguage })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-coral text-base"
              >
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => (
                  <option key={code} value={code}>
                    {flag} {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateClient}
                disabled={creating}
                className="px-6 py-2.5 bg-coral text-white rounded-lg hover:bg-coral/90 disabled:opacity-50 flex items-center gap-2 text-base font-medium"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Client
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
