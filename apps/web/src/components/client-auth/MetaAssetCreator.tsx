'use client';

/**
 * MetaAssetCreator - Form component for creating Meta ad accounts
 *
 * Features:
 * - Account name input with brutalist border styling
 * - Currency dropdown (USD, EUR, GBP, CAD, AUD, etc.)
 * - Timezone dropdown with common timezones
 * - "Create Ad Account" button with brutalist-rounded variant
 * - Loading state with spinner
 * - Success state with teal checkmark
 * - Error state with coral error message
 *
 * Acid Brutalism Design:
 * - Hard borders (border-2 border-black dark:border-white)
 * - Brutalist shadows where appropriate
 * - Coral/teal colors for semantic states
 */

import { useState, FormEvent } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Currency options with symbols
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

// Common timezones with Meta timezone IDs
const TIMEZONES = [
  { id: '1', name: 'Pacific Time (US & Canada)', offset: 'UTC-8' },
  { id: '2', name: 'Mountain Time (US & Canada)', offset: 'UTC-7' },
  { id: '3', name: 'Central Time (US & Canada)', offset: 'UTC-6' },
  { id: '4', name: 'Eastern Time (US & Canada)', offset: 'UTC-5' },
  { id: '5', name: 'Atlantic Time (Canada)', offset: 'UTC-4' },
  { id: '6', name: 'Central European Time', offset: 'UTC+1' },
  { id: '7', name: 'Eastern European Time', offset: 'UTC+2' },
  { id: '8', name: 'Moscow Time', offset: 'UTC+3' },
  { id: '9', name: 'Dubai Time', offset: 'UTC+4' },
  { id: '10', name: 'India Standard Time', offset: 'UTC+5:30' },
  { id: '11', name: 'Bangkok Time', offset: 'UTC+7' },
  { id: '12', name: 'China Standard Time', offset: 'UTC+8' },
  { id: '13', name: 'Japan Standard Time', offset: 'UTC+9' },
  { id: '14', name: 'Australian Eastern Time', offset: 'UTC+10' },
  { id: '15', name: 'New Zealand Time', offset: 'UTC+12' },
  { id: '16', name: 'Greenwich Mean Time', offset: 'UTC+0' },
];

interface CreateAdAccountRequest {
  connectionId: string;
  businessId: string;
  name: string;
  currency: string;
  timezoneId: string;
}

interface CreateAdAccountResponse {
  id: string;
  name: string;
  accountStatus: number;
  currency: string;
}

interface MetaAssetCreatorProps {
  connectionId: string;
  businessId: string;
  accessRequestToken: string;
  onSuccess?: (account: CreateAdAccountResponse) => void;
  onError?: (error: string) => void;
}

type CreationState = 'idle' | 'loading' | 'success' | 'error';

export function MetaAssetCreator({
  connectionId,
  businessId,
  accessRequestToken,
  onSuccess,
  onError,
}: MetaAssetCreatorProps) {
  const [state, setState] = useState<CreationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdAccount, setCreatedAccount] = useState<CreateAdAccountResponse | null>(null);

  // Form state
  const [accountName, setAccountName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezoneId, setTimezoneId] = useState('4'); // Eastern Time default

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!accountName.trim()) {
      setErrorMessage('Please enter an account name');
      setState('error');
      onError?.('Account name is required');
      return;
    }

    try {
      setState('loading');
      setErrorMessage(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/client/${accessRequestToken}/create/meta/ad-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          businessId,
          name: accountName.trim(),
          currency,
          timezoneId,
        } as CreateAdAccountRequest),
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Failed to create ad account');
      }

      // Success
      const account = json.data as CreateAdAccountResponse;
      setCreatedAccount(account);
      setState('success');
      onSuccess?.(account);

      // Reset form after delay
      setTimeout(() => {
        setState('idle');
        setAccountName('');
        setCurrency('USD');
        setTimezoneId('4');
      }, 3000);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create ad account';
      setErrorMessage(message);
      setState('error');
      onError?.(message);
    }
  };

  const handleReset = () => {
    setState('idle');
    setErrorMessage(null);
    setCreatedAccount(null);
  };

  // Success state
  if (state === 'success' && createdAccount) {
    return (
      <div className="border-2 border-[var(--teal)] bg-[var(--teal)]/10 p-6 text-center">
        {/* Success Icon - Brutalist Square */}
        <div className="w-16 h-16 border-2 border-[var(--teal)] bg-[var(--teal)]/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-[var(--teal)]" />
        </div>

        <h3 className="text-lg font-bold text-[var(--ink)] mb-2 font-display">Account Created!</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          "{createdAccount.name}" is ready to use
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
          ID: {createdAccount.id}
        </p>

        <Button
          variant="brutalist-ghost-rounded"
          size="sm"
          onClick={handleReset}
        >
          Create Another
        </Button>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="border-2 border-[var(--coral)] bg-[var(--coral)]/10 p-6">
        <div className="flex items-start gap-3">
          {/* Error Icon - Brutalist Square */}
          <div className="w-10 h-10 border-2 border-[var(--coral)] bg-[var(--coral)]/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-[var(--coral)]" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-[var(--coral)] mb-1 font-display">Creation Failed</h3>
            <p className="text-sm text-[var(--coral)] mb-3">{errorMessage}</p>

            <div className="flex gap-2">
              <Button
                variant="brutalist-rounded"
                size="sm"
                onClick={handleReset}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Account Name Input - Brutalist Style */}
      <div>
        <label
          htmlFor="account-name"
          className="block text-sm font-bold text-[var(--ink)] mb-2 font-display uppercase tracking-wide"
        >
          Account Name
        </label>
        <input
          id="account-name"
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="e.g., Brand Name - Ads"
          disabled={state === 'loading'}
          className="w-full px-4 py-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-slate-900 text-[var(--ink)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--coral)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-brutalist-sm focus:shadow-brutalist transition-shadow"
          maxLength={100}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          A descriptive name for your ad account (max 100 characters)
        </p>
      </div>

      {/* Currency Dropdown - Brutalist Style */}
      <div>
        <label
          htmlFor="currency"
          className="block text-sm font-bold text-[var(--ink)] mb-2 font-display uppercase tracking-wide"
        >
          Currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          disabled={state === 'loading'}
          className="w-full px-4 py-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-slate-900 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-brutalist-sm focus:shadow-brutalist transition-shadow appearance-none cursor-pointer"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code} - {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          The currency for billing and reporting
        </p>
      </div>

      {/* Timezone Dropdown - Brutalist Style */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-bold text-[var(--ink)] mb-2 font-display uppercase tracking-wide"
        >
          Timezone
        </label>
        <select
          id="timezone"
          value={timezoneId}
          onChange={(e) => setTimezoneId(e.target.value)}
          disabled={state === 'loading'}
          className="w-full px-4 py-3 border-2 border-black dark:border-white rounded-lg bg-white dark:bg-slate-900 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-brutalist-sm focus:shadow-brutalist transition-shadow appearance-none cursor-pointer"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.name} ({tz.offset})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Used for reporting and ad scheduling
        </p>
      </div>

      {/* Submit Button - Brutalist Rounded */}
      <Button
        type="submit"
        variant="brutalist-rounded"
        size="lg"
        isLoading={state === 'loading'}
        disabled={!accountName.trim() || state === 'loading'}
        className="w-full mt-6"
        leftIcon={state !== 'loading' ? <Plus className="w-5 h-5" /> : undefined}
      >
        {state === 'loading' ? 'Creating Account...' : 'Create Ad Account'}
      </Button>
    </form>
  );
}
