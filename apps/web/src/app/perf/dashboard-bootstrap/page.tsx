'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogoSpinner } from '@/components/ui/logo-spinner';
import { markPerfHarnessDashboardRedirectStart } from '@/lib/perf-harness';

export default function PerfDashboardBootstrapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token || !userId) {
      return;
    }

    window.localStorage.setItem('__perf_auth_token', token);
    window.localStorage.setItem('__perf_principal_id', userId);
    markPerfHarnessDashboardRedirectStart();
    router.replace('/dashboard');
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <LogoSpinner size="lg" className="mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Initializing dashboard benchmark...</p>
      </div>
    </div>
  );
}
