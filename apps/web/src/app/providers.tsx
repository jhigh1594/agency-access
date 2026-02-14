'use client';

import '@/lib/suppress-extension-hydration'; // Suppress browser extension hydration warnings
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, domAnimation } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance per request to avoid sharing state between users
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - consider data fresh for longer
            gcTime: 10 * 60 * 1000, // 10 minutes - keep cached data available
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch if fresh data exists
          },
        },
      })
  );

  useEffect(() => {
    // Phase 1: Add html.hydrated class on mount
    // This enables CSS transitions for smooth entrance
    requestAnimationFrame(() => {
      document.documentElement.classList.add('hydrated');
    });

    // Phase 2: After 100ms delay, add html.animations-ready class
    // This allows layout to settle before animations start
    const timeoutId = setTimeout(() => {
      document.documentElement.classList.add('animations-ready');
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Get dynamic afterSignUpUrl based on localStorage tier selection
  const getAfterSignUpUrl = () => {
    if (typeof window !== 'undefined') {
      const storedTier = localStorage.getItem('selectedSubscriptionTier');
      if (storedTier && storedTier !== 'STARTER') {
        return `/onboarding/agency?tier=${storedTier}`;
      }
    }
    return '/onboarding/agency';
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider>
        <ClerkProvider
          appearance={{
            cssLayerName: 'clerk',
            elements: {
              formButtonPrimary: 'clerk-form-button-primary',
              socialButtonsBlockButton: 'clerk-social-button',
              socialButtonsBlockButtonText: 'clerk-social-button-text',
              formFieldInput: 'clerk-input',
              modalCloseButton: 'clerk-modal-close-button',
              dividerRow: 'clerk-divider-row',
              dividerLine: 'clerk-divider-line',
              dividerText: 'clerk-divider-text',
              headerSubtitle: 'clerk-header-subtitle',
              formFieldRow__firstName: { display: 'none' },
              formFieldRow__lastName: { display: 'none' },
              formField__firstName: { display: 'none' },
              formField__lastName: { display: 'none' },
            },
          }}
          // Sign-up modal: show 14-day Growth trial message (custom localization override)
          localization={{
            signUp: {
              start: {
                subtitle: "You're starting a 14-day free trial of the Growth plan.",
              },
            },
          }}
          // Redirect to onboarding after signup (new users only) - dynamic based on tier selection
          afterSignUpUrl={getAfterSignUpUrl()}
          // Redirect existing users to dashboard (they'll be redirected to onboarding if needed)
          afterSignInUrl="/dashboard"
        >
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ClerkProvider>
      </ThemeProvider>
    </LazyMotion>
  );
}
