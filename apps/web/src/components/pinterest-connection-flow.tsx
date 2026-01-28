'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PinterestBusinessIdInput } from './pinterest-business-id-input';

interface PinterestConnectionFlowProps {
  agencyId: string;
  connectionStatus: 'pending' | 'success' | 'error';
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Pinterest Connection Flow Orchestrator
 *
 * Manages the multi-step Pinterest connection process:
 * 1. OAuth connection (handled elsewhere)
 * 2. Business ID collection (optional)
 */
export function PinterestConnectionFlow({
  agencyId,
  connectionStatus,
  onSuccess,
  onCancel,
}: PinterestConnectionFlowProps) {
  const [step, setStep] = useState<'business-id' | 'complete'>('business-id');

  // Mutation to save Business ID
  const saveBusinessId = useMutation({
    mutationFn: async (businessId: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/pinterest/business-id`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agencyId, businessId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to save Business ID');
      }

      return response.json();
    },
    onSuccess: () => {
      setStep('complete');
      onSuccess();
    },
  });

  const handleSubmit = (businessId: string) => {
    saveBusinessId.mutate(businessId);
  };

  const handleSkip = () => {
    setStep('complete');
    onSuccess();
  };

  if (connectionStatus !== 'success') {
    return null; // Let parent handle OAuth pending/error states
  }

  if (step === 'complete') {
    return null; // Parent will show success state
  }

  return (
    <PinterestBusinessIdInput
      agencyId={agencyId}
      onSubmit={handleSubmit}
      onSkip={handleSkip}
      isSaving={saveBusinessId.isPending}
    />
  );
}
