/**
 * Agency Onboarding Wizard Page
 *
 * 3-step onboarding flow for new agencies:
 * Step 1: Agency Profile (name, logo, industry, timezone)
 * Step 2: Invite Team (bulk email invite with role assignment)
 * Step 3: First Access Request (guided CTA or skip to dashboard)
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Loader2, Mail, Building2, Users, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import posthog from 'posthog-js';

// Types
interface TeamMember {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface AgencyProfile {
  name: string;
  logoUrl: string;
  industry: string;
  timezone: string;
}

// Industry options
const INDUSTRIES = [
  'Digital Marketing',
  'Advertising Agency',
  'E-commerce',
  'SaaS',
  'Consulting',
  'Other',
];

// Timezone options (simplified)
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function AgencyOnboardingPage() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAgency, setCheckingAgency] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdAgencyId, setCreatedAgencyId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<'STARTER' | 'AGENCY' | null>(null);

  // Read selected tier from URL params or localStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tierParam = urlParams.get('tier')?.toUpperCase();

    const storedTier = typeof window !== 'undefined'
      ? localStorage.getItem('selectedSubscriptionTier')
      : null;

    // Prefer URL param, fallback to localStorage, default to STARTER
    const tier = (tierParam || storedTier) as 'STARTER' | 'AGENCY' | null;
    if (tier && (tier === 'STARTER' || tier === 'AGENCY')) {
      setSelectedTier(tier);
    }
  }, []);

  // Step 1: Agency Profile
  const [agencyProfile, setAgencyProfile] = useState<AgencyProfile>({
    name: '',
    logoUrl: '',
    industry: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Check if user already has an agency (skip onboarding if they do)
  // NOTE: This pattern uses fetch + useEffect instead of React Query because:
  // 1. We need to redirect immediately on agency found
  // 2. No caching needed - always want fresh check
  // 3. Simpler than React Query with enabled flag for this one-time check
  useEffect(() => {
    const checkExistingAgency = async () => {
      if (!userId) {
        setCheckingAgency(false);
        return;
      }

      try {
        // Check by clerkUserId (most reliable identifier)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/agencies?clerkUserId=${encodeURIComponent(userId)}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            // User already has an agency, skip onboarding
            router.replace('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to check existing agency:', err);
      } finally {
        setCheckingAgency(false);
      }
    };

    checkExistingAgency();
  }, [userId, router]);

  // Step 2: Team Members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { email: '', role: 'member' },
  ]);

  // ============================================================
  // STEP HANDLERS
  // ============================================================

  const handleProfileSubmit = async () => {
    if (!agencyProfile.name.trim()) {
      setError('Please enter your agency name');
      return;
    }

    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (!userEmail) {
      setError('Unable to get your email address');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create new agency via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: userId,
          name: agencyProfile.name.trim(),
          email: userEmail,
          subscriptionTier: selectedTier || 'STARTER',
          settings: {
            logoUrl: agencyProfile.logoUrl.trim() || null,
            industry: agencyProfile.industry,
            timezone: agencyProfile.timezone,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create agency');
      }

      const result = await response.json();
      setCreatedAgencyId(result.data.id);
      setLoading(false);

      // Clean up localStorage after successful agency creation
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedSubscriptionTier');
        localStorage.removeItem('selectedBillingInterval');
      }

      // Track agency creation in PostHog
      posthog.capture('agency_created', {
        agency_id: result.data.id,
        agency_name: agencyProfile.name.trim(),
        subscription_tier: selectedTier || 'STARTER',
        industry: agencyProfile.industry || 'not_specified',
        timezone: agencyProfile.timezone,
        has_logo: !!agencyProfile.logoUrl.trim(),
      });

      // Identify the user with their agency info
      posthog.identify(userId!, {
        email: userEmail,
        agency_id: result.data.id,
        agency_name: agencyProfile.name.trim(),
      });

      // Prefetch dashboard data for instant load when user navigates there
      const authToken = await getToken();
      if (authToken) {
        queryClient.prefetchQuery({
          queryKey: ['dashboard', userId],
          queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch dashboard');
            return response.json();
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }

      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agency');
      setLoading(false);
    }
  };

  const handleTeamInvite = async () => {
    // Filter out empty emails
    const validMembers = teamMembers.filter((m) => m.email.trim());

    if (validMembers.length === 0) {
      // Skip if no team members to invite
      setCurrentStep(3);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Bulk invite team members via API (use created agency ID)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agencies/${createdAgencyId}/members/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: validMembers.map((m) => ({
            email: m.email.trim(),
            role: m.role,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to invite team members');
      }

      // Track team member invites in PostHog
      posthog.capture('team_member_invited', {
        agency_id: createdAgencyId,
        total_invited: validMembers.length,
        roles_invited: validMembers.reduce((acc, m) => {
          acc[m.role] = (acc[m.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        source: 'onboarding',
      });

      setLoading(false);
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite team members');
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    // Agency creation is the onboarding completion marker - just redirect
    router.push('/connections');
  };

  // ============================================================
  // TEAM MEMBER HANDLERS
  // ============================================================

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { email: '', role: 'member' }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, updates: Partial<TeamMember>) => {
    setTeamMembers(teamMembers.map((m, i) => (i === index ? { ...m, ...updates } : m)));
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!user || checkingAgency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, label: 'Profile', icon: Building2 },
    { number: 2, label: 'Team', icon: Users },
    { number: 3, label: 'Complete', icon: Check },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">Welcome to AuthHub</h1>
            <span className="text-sm text-slate-500">Step {currentStep} of 3</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;

            return (
              <div key={step.number} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-indigo-600 text-white shadow-md'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </motion.div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-indigo-600' : isCompleted ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="relative w-16 h-0.5 bg-slate-200 overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-indigo-600"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isCompleted ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Agency Profile */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-lg shadow-sm border border-border p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Tell us about your agency</h2>
                <p className="text-slate-600">
                  Let's set up your agency profile to personalize your experience
                </p>
              </div>

              <div className="space-y-6 max-w-md mx-auto">
                <div>
                  <label htmlFor="agency-name" className="block text-sm font-medium text-slate-700 mb-1">
                    Agency Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="agency-name"
                    value={agencyProfile.name}
                    onChange={(e) => setAgencyProfile({ ...agencyProfile, name: e.target.value })}
                    placeholder="e.g., Acme Digital Marketing"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="logo-url" className="block text-sm font-medium text-slate-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    id="logo-url"
                    value={agencyProfile.logoUrl}
                    onChange={(e) => setAgencyProfile({ ...agencyProfile, logoUrl: e.target.value })}
                    placeholder="https://your-agency.com/logo.png"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1">
                    Industry
                  </label>
                  <select
                    id="industry"
                    value={agencyProfile.industry}
                    onChange={(e) => setAgencyProfile({ ...agencyProfile, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select an industry</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-slate-700 mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={agencyProfile.timezone}
                    onChange={(e) => setAgencyProfile({ ...agencyProfile, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleProfileSubmit}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Invite Team */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-lg shadow-sm border border-border p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Invite your team</h2>
                <p className="text-slate-600">
                  Add team members to collaborate on access requests (optional)
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 border border-border rounded-lg"
                  >
                    <Mail className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => updateTeamMember(index, { email: e.target.value })}
                      placeholder="colleague@example.com"
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select
                      value={member.role}
                      onChange={(e) => updateTeamMember(index, { role: e.target.value as any })}
                      className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {teamMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </motion.div>
                ))}

                <button
                  type="button"
                  onClick={addTeamMember}
                  className="w-full p-4 border-2 border-dashed border-border rounded-lg text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Add Another Team Member
                </button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 px-6 py-3 text-slate-700 hover:text-slate-900 border border-border rounded-lg hover:bg-background transition-colors"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleTeamInvite}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-lg shadow-sm border border-border p-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">You're all set!</h2>
                <p className="text-slate-600 mb-8">
                  Your agency profile is ready. What would you like to do next?
                </p>

                <div className="space-y-4 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => router.push('/access-requests/new')}
                    className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">Create Your First Access Request</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteOnboarding}
                    disabled={loading}
                    className="w-full px-6 py-4 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Going to dashboard...
                      </span>
                    ) : (
                      'Go to Dashboard'
                    )}
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
