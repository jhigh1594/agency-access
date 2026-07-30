'use client';

import { ClerkProvider } from '@clerk/nextjs';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_bypass'}>
      {children}
    </ClerkProvider>
  );
}
