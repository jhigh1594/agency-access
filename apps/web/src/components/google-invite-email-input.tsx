'use client';

/**
 * Google Invite Email Input
 *
 * Email input for direct user invite when preferred grant mode is user_invite.
 * Validates email format on blur.
 */

import { useState } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GoogleInviteEmailInputProps {
  value: string;
  onChange: (email: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function GoogleInviteEmailInput({
  value,
  onChange,
  placeholder = 'client@example.com',
  disabled = false,
}: GoogleInviteEmailInputProps) {
  const [touched, setTouched] = useState(false);
  const isValid = !value || EMAIL_REGEX.test(value);
  const showError = touched && value && !isValid;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="google-ads-invite-email"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      >
        Invite email
      </label>
      <input
        id="google-ads-invite-email"
        type="email"
        aria-label="Google Ads invite email"
        aria-invalid={showError}
        aria-describedby={showError ? 'google-ads-email-error' : undefined}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={`h-11 w-full rounded-xl border px-3 text-sm text-ink shadow-sm outline-none transition focus:ring-2 focus:ring-coral/20 ${
          showError
            ? 'border-coral bg-coral/5 focus:border-coral'
            : 'border-border bg-paper focus:border-coral'
        }`}
      />
      {showError && (
        <p id="google-ads-email-error" className="text-xs text-coral" role="alert">
          Please enter a valid email address.
        </p>
      )}
    </div>
  );
}
