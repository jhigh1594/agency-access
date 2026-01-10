/**
 * Unified Onboarding Page
 *
 * Main entry point for the PLG onboarding flow.
 * Implements the "Zero-to-One" flow that gets founders to their first access link in under 60 seconds.
 *
 * Flow:
 * Screen 0: Welcome & Value Hook
 * Screen 1: Quick Agency Profile
 * Screen 2: Client Selection + Platform Selection
 * Screen 3: Success Link Display (The "Aha! Moment")
 * Screen 4: Optional Team Invite
 * Screen 5: Final Success & Dashboard Tease
 *
 * Design Principles:
 * - Opinionated: Smart defaults, guide users down best path
 * - Interruptive: Full-screen experiences for key moments
 * - Interactive: Users CREATE value immediately
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { UnifiedWizard } from '@/components/onboarding/unified-wizard';
import { UnifiedOnboardingProvider, useUnifiedOnboarding } from '@/contexts/unified-onboarding-context';
import { WelcomeScreen } from '@/components/onboarding/screens/welcome-screen';
import { AgencyProfileScreen } from '@/components/onboarding/screens/agency-profile-screen';
import { ClientSelectionScreen } from '@/components/onboarding/screens/client-selection-screen';
import { PlatformSelectionScreen } from '@/components/onboarding/screens/platform-selection-screen';
import { SuccessLinkScreen } from '@/components/onboarding/screens/success-link-screen';
import { TeamInviteScreen } from '@/components/onboarding/screens/team-invite-screen';
import { FinalSuccessScreen } from '@/components/onboarding/screens/final-success-screen';

// ============================================================
// ONBOARDING FLOW COMPONENT
// ============================================================

function OnboardingFlow() {
  const { state, nextStep, prevStep, canGoNext, canGoBack, canSkip, updateAgency, updateClient, updatePlatforms, loadExistingClients, createAgencyAndAccessRequest, addTeamInvite, removeTeamInvite, updateTeamInviteRole, completeOnboarding } = useUnifiedOnboarding();
  const router = useRouter();

  // Handle platform selection change between Screen 2A and 2B
  const handleGenerateLink = async () => {
    await createAgencyAndAccessRequest();
    if (state.accessLink) {
      nextStep();
    }
  };

  // Handle skip (team invite screen)
  const handleSkip = () => {
    nextStep(); // Skip to final screen
  };

  // Render current screen
  const renderScreen = () => {
    switch (state.currentStep) {
      case 0:
        return <WelcomeScreen onNext={nextStep} agencyName={state.agencyName} />;

      case 1:
        return (
          <AgencyProfileScreen
            agencyName={state.agencyName}
            timezone={state.agencySettings.timezone}
            industry={state.agencySettings.industry}
            onUpdate={(data) => updateAgency({ name: data.name, settings: { timezone: data.timezone, industry: data.industry } })}
          />
        );

      case 2:
        return (
          <ClientSelectionScreen
            clientName={state.clientName || ''}
            clientEmail={state.clientEmail || ''}
            existingClients={state.existingClients}
            loading={state.loading}
            onUpdate={(data) => updateClient(data)}
            onLoadClients={loadExistingClients}
          />
        );

      case 3:
        return (
          <PlatformSelectionScreen
            selectedPlatforms={state.selectedPlatforms}
            onUpdate={updatePlatforms}
            onGenerate={handleGenerateLink}
            loading={state.loading}
          />
        );

      case 4:
        return (
          <SuccessLinkScreen
            accessLink={state.accessLink || ''}
            clientName={state.clientName || ''}
            selectedPlatforms={Object.values(state.selectedPlatforms).flat() as any}
          />
        );

      case 5:
        return (
          <TeamInviteScreen
            teamInvites={state.teamInvites}
            onAddInvite={addTeamInvite}
            onRemoveInvite={removeTeamInvite}
            onUpdateInviteRole={updateTeamInviteRole}
            canSendInvites={state.teamInvites.length > 0}
          />
        );

      case 6:
        return (
          <FinalSuccessScreen
            agencyName={state.agencyName}
            accessRequestId={state.accessRequestId || ''}
            teamInvitesSent={state.teamInvites.length}
            onComplete={completeOnboarding}
          />
        );

      default:
        return null;
    }
  };

  return (
    <UnifiedWizard
      currentStep={state.currentStep}
      totalSteps={7}
      onNext={state.currentStep === 3 ? handleGenerateLink : nextStep}
      onBack={prevStep}
      canGoNext={canGoNext()}
      canGoBack={canGoBack()}
      canSkip={canSkip()}
      onSkip={handleSkip}
      loading={state.loading}
      showClose={state.currentStep >= 4} // Can close after value is delivered
      onClose={() => router.push('/dashboard')}
    >
      {renderScreen()}
    </UnifiedWizard>
  );
}

// ============================================================
// PAGE COMPONENT (WITH PROVIDER)
// ============================================================

export default function UnifiedOnboardingPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in' as any);
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <UnifiedOnboardingProvider
      onComplete={() => {
        // Navigate to dashboard after completion
        router.push('/dashboard');
      }}
    >
      <OnboardingFlow />
    </UnifiedOnboardingProvider>
  );
}

// ============================================================
// LAYOUT CONFIGURATION
// ============================================================

// Hide navbar/footer during onboarding for full-screen experience
export const dynamic = 'force-dynamic';
