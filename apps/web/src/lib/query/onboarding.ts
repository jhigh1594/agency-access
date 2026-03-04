import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  UnifiedOnboardingProgress,
  UnifiedOnboardingStatus,
} from '@agency-platform/shared';
import { authorizedApiFetch } from '@/lib/api/authorized-api-fetch';

export interface AgencyOnboardingStatusData {
  completed: boolean;
  status: UnifiedOnboardingStatus;
  lifecycle?: Partial<UnifiedOnboardingProgress>;
  step: {
    profile: boolean;
    members: boolean;
    firstRequest: boolean;
  };
}

interface AgencyOnboardingStatusResponse {
  data: AgencyOnboardingStatusData;
  error: null;
}

interface UpdateOnboardingProgressResponse {
  data: {
    agencyId: string;
    lifecycle: Partial<UnifiedOnboardingProgress>;
  };
  error: null;
}

function clampStep(value: number): number {
  return Math.max(0, Math.min(6, value));
}

export function resolveOnboardingResumeStep(
  statusData: AgencyOnboardingStatusData | null | undefined
): number {
  if (!statusData) {
    return 0;
  }

  const lifecycle = statusData.lifecycle || {};

  if (typeof lifecycle.lastVisitedStep === 'number') {
    return clampStep(lifecycle.lastVisitedStep);
  }

  if (typeof lifecycle.lastCompletedStep === 'number') {
    return clampStep(lifecycle.lastCompletedStep + 1);
  }

  if (statusData.status === 'completed' || statusData.completed) {
    return 6;
  }

  if (statusData.status === 'activated' || statusData.step.firstRequest) {
    return 5;
  }

  if (statusData.status === 'in_progress') {
    return statusData.step.profile ? 2 : 1;
  }

  return 0;
}

export function shouldEnforceOnboardingRedirect(
  statusData: AgencyOnboardingStatusData | null | undefined
): boolean {
  if (!statusData) {
    return false;
  }

  return statusData.status === 'in_progress' || statusData.status === 'not_started';
}

export function useAgencyOnboardingStatus(agencyId?: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['agency-onboarding-status', agencyId || 'none'],
    enabled: !!agencyId,
    queryFn: async () => {
      if (!agencyId) {
        return null;
      }

      const response = await authorizedApiFetch<AgencyOnboardingStatusResponse>(
        `/api/agencies/${agencyId}/onboarding-status`,
        { getToken }
      );

      return response.data;
    },
  });
}

export function useUpdateAgencyOnboardingProgress(agencyId?: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: UnifiedOnboardingProgress) => {
      if (!agencyId) {
        throw new Error('Agency ID is required to update onboarding progress');
      }

      const response = await authorizedApiFetch<UpdateOnboardingProgressResponse>(
        `/api/agencies/${agencyId}/onboarding-progress`,
        {
          method: 'PATCH',
          getToken,
          body: JSON.stringify(progress),
        }
      );

      return response.data;
    },
    onSuccess: async () => {
      if (!agencyId) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['agency-onboarding-status', agencyId] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}
