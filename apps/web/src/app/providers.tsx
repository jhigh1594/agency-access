'use client';

import '@/lib/suppress-extension-hydration'; // Suppress browser extension hydration warnings
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, domAnimation } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

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
    // Mark as mounted to enable animations
    setMounted(true);
    // Add class to body to enable CSS animations
    document.documentElement.classList.add('mounted');
    return () => {
      document.documentElement.classList.remove('mounted');
    };
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <ClerkProvider
        appearance={{
        variables: {
          // Increase base font size
          fontSize: '16px',
          // Spacing
          spacing: '1.5rem',
        },
        layout: {
          // Hide optional fields
          showOptionalFields: false,
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
          // Title text - larger
          headerTitle: 'font-size: 1.75rem; font-weight: 600; color: rgb(var(--foreground));',
          // Subtitle - larger
          headerSubtitle: 'font-size: 1rem; color: rgb(var(--muted-foreground));',
          // Form field labels - larger
          formFieldLabel: 'font-size: 0.95rem; font-weight: 500; color: rgb(var(--foreground));',
          // Input fields - larger text
          input: 'border: 1px solid rgb(var(--border)); border-radius: 0.5rem; font-size: 1rem; padding: 0.75rem;',
          // Primary button - larger text
          formButtonPrimary: 'background-color: rgb(var(--primary)); border-radius: 0.5rem; font-weight: 500; font-size: 1rem; padding: 0.75rem 1.5rem;',
          // Social buttons - larger text
          socialButtonsBlockButton: 'border: 1px solid rgb(var(--border)); border-radius: 0.5rem; font-size: 1rem; padding: 0.75rem;',
          // Footer section
          footer: 'padding-top: 1.5rem; margin-top: 1.5rem;',
          // Footer action link (Sign up link)
          footerActionLink: 'color: rgb(var(--primary)); font-weight: 600; font-size: 0.95rem; text-decoration: none;',
          footerActionText: 'color: rgb(var(--muted-foreground)); font-size: 0.95rem;',
          // Divider - larger
          dividerText: 'color: rgb(var(--muted-foreground)); font-size: 0.9rem;',
        },
      }}
      // Redirect to onboarding after signup (new users only)
      afterSignUpUrl="/onboarding/agency"
      // Redirect existing users to dashboard (they'll be redirected to onboarding if needed)
      afterSignInUrl="/dashboard"
    >
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ClerkProvider>
    </LazyMotion>
  );
}
