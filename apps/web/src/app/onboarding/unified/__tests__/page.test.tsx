import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnifiedOnboardingPage from '../page';

const mockPush = vi.fn();
const mockNextStep = vi.fn();
const mockCreateAgencyAndAccessRequest = vi.fn();
let shouldThrowPlatformScreen = false;

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    userId: 'user_123',
  }),
}));

vi.mock('@/contexts/unified-onboarding-context', () => ({
  UnifiedOnboardingProvider: ({ children }: any) => children,
  useUnifiedOnboarding: () => ({
    state: {
      currentStep: 3,
      selectedPlatforms: { google: ['google_ads'] },
      loading: false,
      teamInvites: [],
      existingClients: [],
      agencyName: 'Acme',
      agencySettings: { timezone: 'America/New_York', industry: 'digital_marketing' },
      completedSteps: new Set<number>(),
      startedAt: Date.now(),
      stepDurations: {},
      error: null,
    },
    nextStep: mockNextStep,
    prevStep: vi.fn(),
    canGoNext: () => true,
    canGoBack: () => true,
    canSkip: () => false,
    updateAgency: vi.fn(),
    updateClient: vi.fn(),
    updatePlatforms: vi.fn(),
    loadExistingClients: vi.fn(),
    createAgencyAndAccessRequest: mockCreateAgencyAndAccessRequest,
    addTeamInvite: vi.fn(),
    removeTeamInvite: vi.fn(),
    updateTeamInviteRole: vi.fn(),
    sendTeamInvites: vi.fn(),
    completeOnboarding: vi.fn(),
    setError: vi.fn(),
  }),
}));

vi.mock('@/components/onboarding/unified-wizard', () => ({
  UnifiedWizard: ({ onNext, children }: any) => {
    return (
      <div>
        {children}
        <button onClick={() => onNext()}>Run Next</button>
      </div>
    );
  },
}));

vi.mock('@/components/onboarding/screens/welcome-screen', () => ({ WelcomeScreen: () => null }));
vi.mock('@/components/onboarding/screens/agency-profile-screen', () => ({ AgencyProfileScreen: () => null }));
vi.mock('@/components/onboarding/screens/client-selection-screen', () => ({ ClientSelectionScreen: () => null }));
vi.mock('@/components/onboarding/screens/platform-selection-screen', () => ({
  PlatformSelectionScreen: () => {
    if (shouldThrowPlatformScreen) {
      throw new Error('platform step exploded');
    }
    return null;
  },
}));
vi.mock('@/components/onboarding/screens/success-link-screen', () => ({ SuccessLinkScreen: () => null }));
vi.mock('@/components/onboarding/screens/team-invite-screen', () => ({ TeamInviteScreen: () => null }));
vi.mock('@/components/onboarding/screens/final-success-screen', () => ({ FinalSuccessScreen: () => null }));

describe('UnifiedOnboardingPage step progression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldThrowPlatformScreen = false;
  });

  it('does not advance when access-request creation fails', async () => {
    mockCreateAgencyAndAccessRequest.mockResolvedValue({ ok: false, error: 'failed' });

    render(<UnifiedOnboardingPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Run Next' }));

    await waitFor(() => {
      expect(mockCreateAgencyAndAccessRequest).toHaveBeenCalled();
    });

    expect(mockNextStep).not.toHaveBeenCalled();
  });

  it('advances immediately when access-request creation succeeds', async () => {
    mockCreateAgencyAndAccessRequest.mockResolvedValue({ ok: true, accessRequestId: 'req-1' });

    render(<UnifiedOnboardingPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Run Next' }));

    await waitFor(() => {
      expect(mockCreateAgencyAndAccessRequest).toHaveBeenCalled();
      expect(mockNextStep).toHaveBeenCalledTimes(1);
    });
  });

  it('renders an in-flow fallback instead of crashing the page when step rendering throws', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrowPlatformScreen = true;

    render(<UnifiedOnboardingPage />);

    expect(screen.getByText(/something went wrong in onboarding/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
