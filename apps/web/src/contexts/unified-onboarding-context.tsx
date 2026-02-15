/**
 * UnifiedOnboardingContext
 *
 * State management for the unified PLG onboarding flow.
 * Implements the "Zero-to-One" flow that gets founders to their first access link in under 60 seconds.
 *
 * Design Principles:
 * - Opinionated: Smart defaults, pre-select best path (Google + Meta)
 * - Interruptive: Full-screen experiences for key moments
 * - Interactive: Users CREATE value (first access request) immediately
 *
 * Flow:
 * Screen 0: Welcome & Value Hook
 * Screen 1: Quick Agency Profile
 * Screen 2A: First Access Request (Client selection)
 * Screen 2B: Platform Selection
 * Screen 3: Aha! Moment (Success link display)
 * Screen 4: Optional Team Invite (fully skippable)
 * Screen 5: Final Success & Dashboard Tease
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Client, Platform, AgencyRole } from '@agency-platform/shared';
import { authorizedApiFetch, AuthorizedApiError } from '@/lib/api/authorized-api-fetch';
import { trackOnboardingEvent } from '@/lib/analytics/onboarding';

// ============================================================
// TYPES
// ============================================================

export interface AgencySettings {
  timezone: string;
  industry: string;
  logoUrl?: string;
}

export interface AgencyData {
  name: string;
  settings?: Partial<AgencySettings>;
}

export interface ClientData {
  id?: string;
  name: string;
  email: string;
}

export type PlatformSelection = Record<string, string[]>; // { google: ['google_ads', 'ga4'], meta: ['meta_ads'] }

export interface TeamInvite {
  email: string;
  role: AgencyRole;
}

export interface OnboardingState {
  // Progress tracking
  currentStep: number;
  completedSteps: Set<number>;
  startedAt: number; // Timestamp when onboarding started
  stepDurations: Record<number, number>; // Time spent on each step

  // Agency profile (Screen 1)
  agencyName: string;
  agencySettings: AgencySettings;

  // First access request (Screen 2A)
  clientId?: string;
  clientEmail?: string;
  clientName?: string;
  existingClients: Client[]; // Loaded from API for typeahead

  // Platform selection (Screen 2B)
  selectedPlatforms: PlatformSelection;
  preSelectedPlatforms: Platform[]; // Google + Meta as smart defaults

  // Generated link (Screen 3 - The Aha! Moment)
  agencyId?: string;
  accessLink?: string;
  accessRequestId?: string;

  // Team invites (Screen 4 - Optional)
  teamInvites: TeamInvite[];

  // Meta state
  loading: boolean;
  error: string | null;
}

interface UnifiedOnboardingContextValue {
  state: OnboardingState;

  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canGoNext: () => boolean;
  canGoBack: () => boolean;
  canSkip: () => boolean;

  // Data updates
  updateAgency: (data: AgencyData) => void;
  updateClient: (data: ClientData) => void;
  updatePlatforms: (platforms: PlatformSelection) => void;
  addTeamInvite: (invite: TeamInvite) => void;
  removeTeamInvite: (email: string) => void;
  updateTeamInviteRole: (email: string, role: AgencyRole) => void;

  // API actions
  loadExistingClients: () => Promise<void>;
  createAgencyAndAccessRequest: () => Promise<CreateAgencyAndAccessRequestResult>;
  sendTeamInvites: () => Promise<boolean>;

  // Completion
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface CreateAgencyAndAccessRequestResult {
  ok: boolean;
  agencyId?: string;
  accessRequestId?: string;
  accessLink?: string;
  error?: string;
}

// ============================================================
// CONTEXT
// ============================================================

const UnifiedOnboardingContext = createContext<UnifiedOnboardingContextValue | undefined>(undefined);

// ============================================================
// INITIAL STATE & CONSTANTS
// ============================================================

const TOTAL_STEPS = 7; // 0-6 (7 screens total: Welcome, Agency, Client, Platform, Success, Team, Final)

const PRESELECTED_PLATFORMS: Platform[] = ['google_ads', 'meta_ads']; // 80% of use cases

const initialState: OnboardingState = {
  // Progress
  currentStep: 0,
  completedSteps: new Set<number>(),
  startedAt: Date.now(),
  stepDurations: {},

  // Agency profile
  agencyName: '',
  agencySettings: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    industry: 'digital_marketing', // Smart default
    logoUrl: '',
  },

  // Client
  clientId: undefined,
  clientEmail: '',
  clientName: '',
  existingClients: [],

  // Platforms
  selectedPlatforms: {
    google: PRESELECTED_PLATFORMS.filter((p) => p.startsWith('google')),
    meta: PRESELECTED_PLATFORMS.filter((p) => p.startsWith('meta')),
  },
  preSelectedPlatforms: PRESELECTED_PLATFORMS,

  // Generated link
  agencyId: undefined,
  accessLink: undefined,
  accessRequestId: undefined,

  // Team invites
  teamInvites: [],

  // Meta
  loading: false,
  error: null,
};

// ============================================================
// PROVIDER
// ============================================================

interface UnifiedOnboardingProviderProps {
  children: ReactNode;
  onComplete?: () => void; // Optional callback when onboarding completes
}

export function UnifiedOnboardingProvider({
  children,
  onComplete,
}: UnifiedOnboardingProviderProps) {
  const router = useRouter();
  const { userId, orgId, getToken } = useAuth();
  const { user } = useUser();

  const [state, setState] = useState<OnboardingState>(initialState);

  // ============================================================
  // ANALYTICS TRACKING
  // ============================================================

  useEffect(() => {
    trackOnboardingEvent('onboarding_started', {
      version: 'unified_v1',
      timestamp: Date.now(),
      userId,
    });
  }, [userId]);

  useEffect(() => {
    // Track step completion
    if (state.currentStep > 0) {
      const prevStep = state.currentStep - 1;
      if (!state.completedSteps.has(prevStep)) {
        setState((prev) => {
          const newCompleted = new Set(prev.completedSteps);
          newCompleted.add(prevStep);

          const duration = Date.now() - prev.startedAt;
          trackOnboardingEvent('onboarding_step_completed', {
            step: prevStep,
            durationMs: duration,
            timestamp: Date.now(),
          });

          return { ...prev, completedSteps: newCompleted };
        });
      }
    }
  }, [state.currentStep, state.completedSteps, state.startedAt]);

  // ============================================================
  // NAVIGATION METHODS
  // ============================================================

  const nextStep = useCallback(() => {
    if (state.currentStep < TOTAL_STEPS) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1, error: null }));
    }
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1, error: null }));
    }
  }, [state.currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step <= TOTAL_STEPS) {
        setState((prev) => ({ ...prev, currentStep: step, error: null }));
      }
    },
    [TOTAL_STEPS]
  );

  const canGoNext = useCallback(() => {
    switch (state.currentStep) {
      case 0: // Welcome screen - always can proceed
        return true;
      case 1: // Agency profile - requires agency name
        return state.agencyName.trim().length > 0;
      case 2: // Client selection - requires client name and email
        return ((state.clientName ?? '').trim().length > 0) && ((state.clientEmail ?? '').trim().length > 0);
      case 3: // Platform selection - requires at least one platform
        const platformCount = Object.values(state.selectedPlatforms || {}).reduce(
          (sum, platforms) => sum + (platforms?.length || 0),
          0
        );
        return platformCount > 0;
      case 4: // Success link display - always can proceed
        return true;
      case 5: // Team invite - optional, always can proceed
        return true;
      default:
        return false;
    }
  }, [state]);

  const canGoBack = useCallback(() => {
    // Can't go back from welcome screen
    // Can't go back once access link is generated (Screen 4+)
    return state.currentStep > 0 && state.currentStep < 4;
  }, [state.currentStep]);

  const canSkip = useCallback(() => {
    // Only team invite (Screen 5) can be skipped
    return state.currentStep === 5;
  }, [state.currentStep]);

  // ============================================================
  // DATA UPDATE METHODS
  // ============================================================

  const updateAgency = useCallback((data: AgencyData) => {
    setState((prev) => ({
      ...prev,
      agencyName: data.name,
      agencySettings: {
        ...prev.agencySettings,
        ...data.settings,
      },
    }));
  }, []);

  const updateClient = useCallback((data: ClientData) => {
    setState((prev) => ({
      ...prev,
      clientId: data.id,
      clientName: data.name,
      clientEmail: data.email,
    }));
  }, []);

  const updatePlatforms = useCallback((platforms: PlatformSelection) => {
    setState((prev) => ({
      ...prev,
      selectedPlatforms: platforms,
    }));
  }, []);

  const addTeamInvite = useCallback((invite: TeamInvite) => {
    setState((prev) => ({
      ...prev,
      teamInvites: [...prev.teamInvites, invite],
    }));
  }, []);

  const removeTeamInvite = useCallback((email: string) => {
    setState((prev) => ({
      ...prev,
      teamInvites: prev.teamInvites.filter((invite) => invite.email !== email),
    }));
  }, []);

  const updateTeamInviteRole = useCallback((email: string, role: AgencyRole) => {
    setState((prev) => ({
      ...prev,
      teamInvites: prev.teamInvites.map((invite) =>
        invite.email === email ? { ...invite, role } : invite
      ),
    }));
  }, []);

  const flattenSelectedPlatforms = useCallback((selection: PlatformSelection) => {
    return Object.values(selection || {}).flat().filter(Boolean);
  }, []);

  // ============================================================
  // API METHODS
  // ============================================================

  const loadExistingClients = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const json = await authorizedApiFetch<{ data: Client[]; error: null }>('/api/clients', {
        getToken,
      });

      setState((prev) => ({
        ...prev,
        existingClients: json.data || [],
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof AuthorizedApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Failed to load clients';

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, [getToken]);

  const createAgencyAndAccessRequest = useCallback(async (): Promise<CreateAgencyAndAccessRequestResult> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress;
      const principalClerkId = orgId || userId;

      // Step 1: Resolve agency (existing first, then create)
      let agencyId = state.agencyId;
      if (!agencyId && principalClerkId) {
        const existingAgencyResponse = await authorizedApiFetch<{ data: Array<{ id: string }>; error: null }>(
          `/api/agencies?clerkUserId=${encodeURIComponent(principalClerkId)}`,
          { getToken }
        );

        if (existingAgencyResponse.data.length > 0) {
          agencyId = existingAgencyResponse.data[0].id;
        }
      }

      if (!agencyId) {
        if (!userEmail) {
          throw new Error('Unable to resolve your account email from Clerk.');
        }

        const agencyJson = await authorizedApiFetch<{ data: { id: string }; error: null }>('/api/agencies', {
          method: 'POST',
          getToken,
          body: JSON.stringify({
            clerkUserId: principalClerkId || undefined,
            name: state.agencyName,
            email: userEmail,
            settings: {
              timezone: state.agencySettings.timezone,
              industry: state.agencySettings.industry,
              logoUrl: state.agencySettings.logoUrl || undefined,
            },
          }),
        });
        agencyId = agencyJson.data.id;
      }

      // Step 2: Create or select client
      let clientId = state.clientId;

      if (!clientId) {
        const clientJson = await authorizedApiFetch<{ data: { id: string }; error: null }>('/api/clients', {
          method: 'POST',
          getToken,
          body: JSON.stringify({
            name: state.clientName,
            company: state.clientName,
            email: state.clientEmail,
            language: 'en',
          }),
        });
        clientId = clientJson.data.id;
      }

      // Step 3: Create access request
      const accessRequestJson = await authorizedApiFetch<{ data: { id: string; uniqueToken: string; agencyId?: string }; error: null }>(
        '/api/access-requests',
        {
          method: 'POST',
          getToken,
          body: JSON.stringify({
            agencyId,
            clientId,
            clientName: state.clientName,
            clientEmail: state.clientEmail,
            authModel: 'client_authorization',
            platforms: state.selectedPlatforms,
          }),
        }
      );

      const accessRequest = accessRequestJson.data;
      const resolvedAgencyId = accessRequest.agencyId || agencyId;
      const accessLink = `${window.location.origin}/authorize/${accessRequest.uniqueToken}`;

      const timeToValue = Date.now() - state.startedAt;
      trackOnboardingEvent('first_access_link_generated', {
        agencyId: resolvedAgencyId,
        clientId,
        accessRequestId: accessRequest.id,
        platformCount: flattenSelectedPlatforms(state.selectedPlatforms).length,
        timeToValueMs: timeToValue,
      });

      // Update state with generated link
      setState((prev) => ({
        ...prev,
        agencyId: resolvedAgencyId,
        accessLink,
        accessRequestId: accessRequest.id,
        loading: false,
      }));

      return {
        ok: true,
        agencyId: resolvedAgencyId,
        accessRequestId: accessRequest.id,
        accessLink,
      };
    } catch (err) {
      const errorMessage = err instanceof AuthorizedApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Network error. Please try again.';

      trackOnboardingEvent('onboarding_step_failed', {
        step: state.currentStep,
        message: errorMessage,
        timestamp: Date.now(),
      });

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));

      return {
        ok: false,
        error: errorMessage,
      };
    }
  }, [flattenSelectedPlatforms, getToken, orgId, state, user, userId]);

  const sendTeamInvites = useCallback(async (): Promise<boolean> => {
    if (state.teamInvites.length === 0) {
      return true;
    }

    if (!state.agencyId) {
      setState((prev) => ({
        ...prev,
        error: 'Agency is missing. Please regenerate your access link before inviting team members.',
      }));
      return false;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      await authorizedApiFetch(`/api/agencies/${state.agencyId}/members/bulk`, {
        method: 'POST',
        getToken,
        body: JSON.stringify({
          members: state.teamInvites.map((invite) => ({
            email: invite.email,
            role: invite.role,
          })),
        }),
      });

      trackOnboardingEvent('team_invites_sent', {
        count: state.teamInvites.length,
        timestamp: Date.now(),
      });

      setState((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (err) {
      const errorMessage = err instanceof AuthorizedApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Network error. Please try again.';

      trackOnboardingEvent('onboarding_step_failed', {
        step: state.currentStep,
        message: errorMessage,
        timestamp: Date.now(),
      });

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      return false;
    }
  }, [getToken, state.agencyId, state.currentStep, state.teamInvites]);

  // ============================================================
  // COMPLETION METHODS
  // ============================================================

  const completeOnboarding = useCallback(async () => {
    const totalTime = Date.now() - state.startedAt;
    trackOnboardingEvent('onboarding_completed', {
      version: 'unified_v1',
      totalDurationMs: totalTime,
      stepsSkipped: state.teamInvites.length === 0 ? ['team_invite'] : [],
      accessRequestId: state.accessRequestId,
    });

    // Call completion callback if provided
    if (onComplete) {
      onComplete();
    }

    // Navigate to dashboard
    router.push('/dashboard');
  }, [state, router, onComplete]);

  const skipOnboarding = useCallback(() => {
    trackOnboardingEvent('onboarding_skipped', {
      version: 'unified_v1',
      step: state.currentStep,
      timestamp: Date.now(),
    });

    // Navigate to dashboard
    router.push('/dashboard');
  }, [state.currentStep, router]);

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ============================================================
  // AUTO-FILL FROM CLERK USER DATA
  // ============================================================

  useEffect(() => {
    // Pre-fill agency name from user's organization or email
    if (user && !state.agencyName) {
      const firstName = user.firstName;
      const lastName = user.lastName;
      const email = user.emailAddresses[0]?.emailAddress || '';

      let suggestedName = '';

      if (firstName && lastName) {
        suggestedName = `${firstName} ${lastName}'s Agency`;
      } else {
        // Extract name from email (e.g., "john" from "john@company.com")
        const emailName = email.split('@')[0];
        suggestedName = `${emailName}'s Agency`;
      }

      setState((prev) => ({
        ...prev,
        agencyName: suggestedName,
      }));
    }
  }, [user, state.agencyName]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value: UnifiedOnboardingContextValue = {
    state,
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoBack,
    canSkip,
    updateAgency,
    updateClient,
    updatePlatforms,
    addTeamInvite,
    removeTeamInvite,
    updateTeamInviteRole,
    loadExistingClients,
    createAgencyAndAccessRequest,
    sendTeamInvites,
    completeOnboarding,
    skipOnboarding,
    setError,
    clearError,
  };

  return (
    <UnifiedOnboardingContext.Provider value={value}>
      {children}
    </UnifiedOnboardingContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useUnifiedOnboarding() {
  const context = useContext(UnifiedOnboardingContext);
  if (context === undefined) {
    throw new Error('useUnifiedOnboarding must be used within UnifiedOnboardingProvider');
  }
  return context;
}
