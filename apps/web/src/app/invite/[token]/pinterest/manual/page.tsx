'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PinterestManualWizard } from '@/components/client-auth/pinterest/PinterestManualWizard';

interface AccessRequestData {
  agencyName: string;
  agencyBusinessId?: string;
  platforms: string[];
}

export default function PinterestManualPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencyId = searchParams.get('agencyId') || '';

  const [accessRequest, setAccessRequest] = useState<AccessRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch access request details
  useEffect(() => {
    const fetchAccessRequest = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/access-requests/${token}`
        );

        if (!response.ok) {
          throw new Error('Failed to load access request');
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(result.error.message);
        }

        setAccessRequest(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load access request');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccessRequest();
  }, [token]);

  // Connect mutation
  const { mutate: connectPinterest, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/${token}/pinterest/manual-connect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: accessRequest?.agencyBusinessId || '',
            clientEmail: '', // Will be collected from user
          }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Failed to connect Pinterest');
      }

      return response.json();
    },
    onSuccess: () => {
      router.push(`/invite/${token}?success=true&platform=pinterest`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to connect Pinterest');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !accessRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <PinterestManualWizard
          agencyName={accessRequest?.agencyName || 'Agency'}
          businessId={accessRequest?.agencyBusinessId || ''}
          onComplete={() => connectPinterest()}
          isPending={isPending}
          error={error}
        />
      </div>
    </div>
  );
}
