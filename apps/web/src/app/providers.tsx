'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance per request to avoid sharing state between users
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ClerkProvider
      appearance={{
        variables: {
          // Spacing
          spacing: '1.5rem',
        },
        layout: {
          // Show optional fields
          showOptionalFields: true,
          // Social buttons placement
          socialButtonsPlacement: 'top',
        },
        elements: {
          // Root box - centered
          rootBox: 'mx-auto w-full',
          // Modal box styling - centered with subtle shadow
          modalBox: 'width: 100%; max-width: 600px; margin: auto; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);',
          // Card styling
          card: 'width: 100%; max-width: 600px;',
          // Form container
          form: 'padding: 1.5rem;',
          // Header section
          header: 'padding-bottom: 1.5rem;',
          // Title text
          headerTitle: 'font-size: 1.5rem; font-weight: 600;',
          // Subtitle
          headerSubtitle: 'font-size: 0.875rem; color: rgb(var(--muted-foreground));',
          // Input fields
          input: 'border: 1px solid rgb(var(--border)); border-radius: 0.5rem;',
          // Primary button
          formButtonPrimary: 'background-color: rgb(var(--primary)); border-radius: 0.5rem; font-weight: 500;',
          // Social buttons
          socialButtonsBlockButton: 'border: 1px solid rgb(var(--border)); border-radius: 0.5rem;',
          // Footer section
          footer: 'padding-top: 1.5rem; margin-top: 1.5rem;',
          // Divider
          dividerText: 'color: rgb(var(--muted-foreground));',
        },
      }}
      // Redirect to onboarding after signup (new users only)
      afterSignUpUrl="/onboarding/agency"
      // Redirect existing users to dashboard (they'll be redirected to onboarding if needed)
      afterSignInUrl="/dashboard"
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ClerkProvider>
  );
}
