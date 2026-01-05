/**
 * New Access Request Page - Phase 5 Enhanced
 *
 * Complete rewrite integrating:
 * - AccessRequestContext for state management
 * - TemplateSelector for Step 0
 * - ClientSelector for Step 1
 * - HierarchicalPlatformSelector + AccessLevelSelector for Step 2
 * - Framer Motion animations
 * - Enhanced progress indicator
 * - Platform count animations
 * - Save as Template modal on final step
 */

'use client';

import { Fragment, FormEvent, useMemo, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Check, Loader2, AlertCircle, Save, Shield, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Phase 5 Components
import { TemplateSelector } from '@/components/template-selector';
import { ClientSelector } from '@/components/client-selector';
import { AuthModelSelector } from '@/components/auth-model-selector';
import { HierarchicalPlatformSelector } from '@/components/hierarchical-platform-selector';
import { AccessLevelSelector } from '@/components/access-level-selector';
import { SaveAsTemplateModal } from '@/components/save-as-template-modal';
import { PlatformConnectionModal } from '@/components/platform-connection-modal';

// Context & Utilities
import { AccessRequestProvider, useAccessRequest } from '@/contexts/access-request-context';
import type { IntakeField } from '@/contexts/access-request-context';
import { getPlatformCount } from '@/lib/transform-platforms';
import type { AccessRequestTemplate } from '@agency-platform/shared';

// ============================================================
// WIZARD CONTENT (Inner Component)
// ============================================================

function AccessRequestWizardContent() {
  const { userId } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const {
    state,
    updateTemplate,
    updateClient,
    updateAuthModel,
    updatePlatforms,
    updateAccessLevel,
    updateIntakeFields,
    updateBranding,
    setStep,
    submitRequest,
    validateStep,
  } = useAccessRequest();

  // Save as Template modal state
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);

  // Platform Connection Modal state
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);

  // Customize tab state (for Step 3: Form Fields | Branding)
  const [customizeTab, setCustomizeTab] = useState<'fields' | 'branding'>('fields');

  // Template expanded state (for Step 1: Collapsible template section)
  const [templateExpanded, setTemplateExpanded] = useState(false);

  // Fetch agency by email - SAME approach as connections page
  const { data: agencyData } = useQuery({
    queryKey: ['user-agency', user?.primaryEmailAddress?.emailAddress],
    queryFn: async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return null;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agencies?email=${encodeURIComponent(email)}`
      );
      if (!response.ok) throw new Error('Failed to fetch agency');
      const result = await response.json();
      return result.data?.[0] || null;
    },
    enabled: !!user?.primaryEmailAddress?.emailAddress,
  });

  // Use the agency's UUID id
  const agencyId = agencyData?.id;

  // Fetch platform connections using the SAME endpoint as connections page
  const {
    data: platformConnections = [],
    isLoading: isLoadingConnections,
  } = useQuery({
    queryKey: ['available-platforms', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/available?agencyId=${agencyId}`
      );
      if (!response.ok) throw new Error('Failed to fetch platforms');
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!agencyId,
  });

  // Build platform connection status map for AuthModelSelector
  // The /agency-platforms/available endpoint returns { platform, connected, ... }
  const agencyHasConnectedPlatforms = useMemo(() => {
    const statusMap: Record<string, boolean> = {};
    platformConnections.forEach((conn: { platform: string; connected?: boolean; status?: string }) => {
      // Support both formats: 'connected' from /available endpoint, 'status' from direct endpoint
      if (conn.connected === true || conn.status === 'active') {
        statusMap[conn.platform] = true;
      }
    });
    return statusMap;
  }, [platformConnections]);

  // Calculate platform counts
  const platformCount = useMemo(
    () => getPlatformCount(state.selectedPlatforms),
    [state.selectedPlatforms]
  );

  // Validation for current step
  const currentStepValid = useMemo(() => {
    return validateStep(state.currentStep).valid;
  }, [state.currentStep, validateStep]);

  // Intake field handlers
  const addIntakeField = () => {
    const newField: IntakeField = {
      id: String(state.intakeFields.length + 1),
      label: '',
      type: 'text',
      required: false,
      order: state.intakeFields.length,
    };
    updateIntakeFields([...state.intakeFields, newField]);
  };

  const removeIntakeField = (id: string) => {
    updateIntakeFields(state.intakeFields.filter((f) => f.id !== id));
  };

  const updateIntakeField = (id: string, updates: Partial<IntakeField>) => {
    updateIntakeFields(state.intakeFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  // Submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitRequest();
  };

  // Template selection handler
  const handleTemplateSelect = (template: AccessRequestTemplate | null) => {
    updateTemplate(template);
    // Auto-advance to next step if template selected
    if (template) {
      setStep(1);
    }
  };

  // Step labels (1-4 with new streamlined flow)
  const steps = [
    { number: 1, label: 'Fundamentals' },
    { number: 2, label: 'Platforms' },
    { number: 3, label: 'Customize' },
    { number: 4, label: 'Review' },
  ];

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">New Access Request</h1>
          <p className="text-sm text-slate-600 mt-1">
            Create a request for client authorization
          </p>
        </div>

        {/* Form & Progress - New Linear Progress */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="py-8">
          {/* Linear Progress Bar */}
          <div className="mb-8">
            <div className="relative h-1 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-indigo-600"
                initial={{ width: 0 }}
                animate={{
                  width: `${((state.currentStep) / steps.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>

            {/* Step Markers */}
            <div className="flex justify-between mt-4">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`text-xs font-mono font-medium tracking-wide ${
                      step.number <= state.currentStep
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }`}
                  >
                    STEP {String(step.number).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      step.number === state.currentStep
                        ? 'text-slate-900'
                        : step.number < state.currentStep
                        ? 'text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Percentage Indicator */}
            <div className="text-right mt-2">
              <span className="text-xs font-mono font-medium text-slate-500">
                {Math.round((state.currentStep / steps.length) * 100)}% COMPLETE
              </span>
            </div>
          </div>
      </div>

      {/* Form */}
      <form id="access-request-form" onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* Step 1: Fundamentals (Template + Client + Auth Model) */}
          {state.currentStep === 1 && (
            <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
            >
            {/* Main Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Fundamentals</h2>
              <p className="text-base text-slate-600 mb-6">
                Set up the basics for your access request
              </p>

              {/* Vertical Flow with Clear Sections */}
              <div className="relative space-y-10 pl-5">
                {/* Connecting line - runs through all sections */}
                <div className="absolute left-[18px] top-3 bottom-3 w-px bg-slate-200 pointer-events-none" />

                {/* Section 1: Client (Primary, Required) */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative z-10 h-9 w-9 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center">
                      <span className="text-sm font-semibold text-indigo-700">1</span>
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-slate-900">
                        Select Client <span className="text-red-500">*</span>
                      </label>
                      <p className="text-sm text-slate-500">Who is this access request for?</p>
                    </div>
                  </div>
                  <div className="ml-10">
                    <ClientSelector
                      agencyId={agencyId!}
                      value={state.client?.id}
                      onSelect={updateClient}
                    />
                  </div>
                </div>

                {/* Section 2: Auth Model (Secondary, Has Default) */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative z-10 h-9 w-9 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center">
                      <span className="text-sm font-semibold text-slate-600">2</span>
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-slate-900">
                        Authorization Model
                      </label>
                      <p className="text-sm text-slate-500">How will you access their platform accounts?</p>
                    </div>
                  </div>
                  <div className="ml-10">
                    <AuthModelSelector
                      agencyHasConnectedPlatforms={agencyHasConnectedPlatforms}
                    />
                  </div>
                </div>

                {/* Section 3: Template (Optional, Collapsible) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTemplateExpanded(!templateExpanded)}
                    className="flex items-center gap-3 w-full text-left group"
                  >
                    <div className="relative z-10 h-9 w-9 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center">
                      <span className="text-sm font-semibold text-slate-600">3</span>
                    </div>
                    <div className="flex-1">
                      <label className="block text-base font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        Start from Template <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <p className="text-sm text-slate-500">
                        {templateExpanded ? 'Hide template selector' : 'Skip manually configuring platforms and branding'}
                      </p>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${
                      templateExpanded ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {templateExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-10 mt-4"
                    >
                      <TemplateSelector
                        agencyId={agencyId!}
                        selectedTemplate={state.selectedTemplate}
                        onSelect={updateTemplate}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Quick Actions - only shown for delegated_access */}
            {state.authModel === 'delegated_access' && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-slate-900">Need to connect platforms?</p>
                  <p className="text-sm text-slate-600">Connect your agency's platform accounts to use delegated access</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlatformModalOpen(true)}
                  className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-base rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Manage Platform Connections
                </button>
              </div>
            )}

            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-base text-red-800">{state.error}</p>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!state.client || !state.authModel}
                className="px-8 py-3 bg-indigo-600 text-white text-base rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md font-medium"
              >
                Continue to Platforms
              </button>
            </div>
          </motion.div>
          )}

          {/* Step 2: Platforms & Access Level */}
          {state.currentStep === 2 && (
            <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
            >
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Platforms & Access</h2>
            <p className="text-sm text-slate-600 mb-6">
              Select which platforms to include in this access request
            </p>

            <div className="space-y-6">
              {/* Access Level Section - Prominent at top */}
              <AccessLevelSelector
                selectedAccessLevel={state.globalAccessLevel ?? undefined}
                onSelectionChange={updateAccessLevel}
              />

              {/* Platform Selection Section */}
              <div>
              <div className="flex items-baseline justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Select Platforms
                </label>
                {platformCount > 0 && (
                  <span className="text-sm text-indigo-600 font-medium">
                    {platformCount} selected
                  </span>
                )}
              </div>

              <HierarchicalPlatformSelector
                selectedPlatforms={state.selectedPlatforms}
                onSelectionChange={updatePlatforms}
                connectedPlatforms={platformConnections}
                agencyId={agencyId}
              />

              {/* Info about connecting more platforms */}
              {platformConnections.filter((p: any) => p.connected).length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  Only your connected platforms are shown.{' '}
                  <a href="/connections" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Connect more platforms
                  </a>{' '}
                  to include them in access requests.
                </p>
              )}
              </div>
            </div>

            {state.error && (
              <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
              >
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{state.error}</p>
              </motion.div>
            )}

            <div className="mt-6 flex justify-between">
              <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
              Back
              </button>
              <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!currentStepValid}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
              >
              Continue to Customize
              </button>
            </div>
            </motion.div>
          )}

          {/* Step 3: Customize (Intake Fields + Branding with tabs) */}
          {state.currentStep === 3 && (
            <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
            >
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Customize</h2>
            <p className="text-sm text-slate-600 mb-6">
              Add form fields and customize branding <span className="text-slate-400">(optional)</span>
            </p>

            {/* Simple Tabs - Form Fields | Branding */}
            <div className="mb-6">
              <div className="flex gap-4 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setCustomizeTab('fields')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors ${
                    customizeTab === 'fields'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Form Fields ({state.intakeFields.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeTab('branding')}
                  className={`pb-3 px-1 text-sm font-medium transition-colors ${
                    customizeTab === 'branding'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Branding
                </button>
              </div>
            </div>

            {/* Form Fields Tab */}
            {customizeTab === 'fields' && (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
              {state.intakeFields.map((field, index) => (
                <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                <div className="flex-1 space-y-3">
                  <input
                type="text"
                value={field.label}
                onChange={(e) => updateIntakeField(field.id, { label: e.target.value })}
                placeholder="Field label (e.g., Company Website)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-3">
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateIntakeField(field.id, { type: e.target.value as any })
                  }
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="url">URL</option>
                  <option value="textarea">Text Area</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
              updateIntakeField(field.id, { required: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Required
                </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeIntakeField(field.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                </motion.div>
              ))}
              </AnimatePresence>

              <button
                type="button"
                onClick={addIntakeField}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
              </div>
            )}

            {/* Branding Tab */}
            {customizeTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-slate-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    id="logoUrl"
                    value={state.branding.logoUrl}
                    onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://your-agency.com/logo.png"
                  />
                </div>

                <div>
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={state.branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      className="h-11 w-20 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={state.branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subdomain" className="block text-sm font-medium text-slate-700 mb-1">
                    Subdomain
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      id="subdomain"
                      value={state.branding.subdomain}
                      onChange={(e) => updateBranding({ subdomain: e.target.value.toLowerCase() })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="my-agency"
                      pattern="[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?"
                    />
                    <span className="px-4 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600 text-sm">
                      .agencyplatform.com
                    </span>
                  </div>
                </div>

                {/* Preview */}
                {(state.branding.logoUrl || state.branding.primaryColor !== '#6366f1') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <p className="text-sm font-medium text-slate-700 mb-3">Preview</p>
                    <div
                      className="p-6 rounded-lg text-center transition-colors"
                      style={{ backgroundColor: state.branding.primaryColor + '15' }}
                    >
                      {state.branding.logoUrl && (
                        <img
                          src={state.branding.logoUrl}
                          alt="Logo"
                          className="h-10 mx-auto mb-3 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <h3
                        className="text-lg font-semibold mb-1.5"
                        style={{ color: state.branding.primaryColor }}
                      >
                        {state.client?.name || 'Your Client'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Authorize access to {platformCount} platform{platformCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{state.error}</p>
              </motion.div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
              >
                Review & Create
              </button>
            </div>
            </motion.div>
          )}

            {/* Step 4: Review & Create */}
            {state.currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">Review & Create</h2>
                  <p className="text-sm text-slate-600">
                    Review your access request settings before creating
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-200">
                  {/* Client Section */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-slate-600">
                          {state.client?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Client</p>
                        <p className="text-base font-semibold text-slate-900">{state.client?.name || 'Not selected'}</p>
                        {state.client?.email && (
                          <p className="text-sm text-slate-600">{state.client.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auth Model Section */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Authorization Model</p>
                        <p className="text-base font-semibold text-slate-900">
                          {state.authModel === 'delegated_access' ? 'Delegated Access' : 'Client Authorization'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {state.authModel === 'delegated_access'
                            ? 'Agency grants access using their own platform connections'
                            : 'Client authorizes their own platform accounts'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Platforms Section */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Platforms</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {Object.entries(state.selectedPlatforms).map(([platform, products]) => (
                            <span
                              key={platform}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                            >
                              {platform} ({products.length})
                            </span>
                          ))}
                          {platformCount === 0 && (
                            <span className="text-sm text-slate-500 italic">No platforms selected</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{platformCount} product{platformCount !== 1 ? 's' : ''} selected</p>
                      </div>
                    </div>
                  </div>

                  {/* Access Level Section */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Access Level</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                          state.globalAccessLevel! === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : state.globalAccessLevel! === 'standard'
                            ? 'bg-blue-100 text-blue-700'
                            : state.globalAccessLevel! === 'read_only'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {state.globalAccessLevel! === 'admin'
                            ? 'ADMIN'
                            : state.globalAccessLevel! === 'standard'
                            ? 'STANDARD'
                            : state.globalAccessLevel! === 'read_only'
                            ? 'READ ONLY'
                            : 'EMAIL ONLY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Intake Fields Section */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Plus className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Form Fields</p>
                        <p className="text-base font-semibold text-slate-900">
                          {state.intakeFields.length} field{state.intakeFields.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-slate-600">
                          {state.intakeFields.filter(f => f.required).length} required, {state.intakeFields.filter(f => !f.required).length} optional
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Branding Section (if configured) */}
                  {(state.branding.logoUrl || state.branding.primaryColor !== '#6366f1' || state.branding.subdomain) && (
                    <div className="p-4 flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                          {state.branding.logoUrl ? (
                            <img src={state.branding.logoUrl} alt="" className="h-5 w-5 object-contain" />
                          ) : (
                            <span className="text-xs font-bold text-pink-600">B</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Branding</p>
                          <div className="flex items-center gap-2 mt-1">
                            {state.branding.logoUrl && (
                              <span className="text-sm text-slate-700">Custom logo</span>
                            )}
                            {state.branding.primaryColor !== '#6366f1' && (
                              <span className="text-sm text-slate-700">Custom color</span>
                            )}
                            {state.branding.subdomain && (
                              <span className="text-sm text-slate-700">{state.branding.subdomain}.agencyplatform.com</span>
                            )}
                          </div>
                        </div>
                        {/* Preview */}
                        {(state.branding.logoUrl || state.branding.primaryColor !== '#6366f1') && (
                          <div
                            className="w-24 h-12 rounded-md flex items-center justify-center text-xs font-medium text-center px-2"
                            style={{
                              backgroundColor: state.branding.primaryColor + '15',
                              color: state.branding.primaryColor,
                            }}
                          >
                            {state.branding.logoUrl ? (
                              <img src={state.branding.logoUrl} alt="" className="h-6 w-6 object-contain" />
                            ) : (
                              <span className="truncate">Preview</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {state.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{state.error}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    disabled={state.submitting}
                  >
                    Back
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSaveTemplateModalOpen(true)}
                      className="px-4 py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2"
                      disabled={state.submitting}
                    >
                      <Save className="h-4 w-4" />
                      Save as Template
                    </button>
                    <button
                      type="submit"
                      disabled={state.submitting}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      {state.submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {state.submitting ? 'Creating Request...' : 'Create Access Request'}
                    </button>
                  </div>
                </div>

                {/* Save as Template Modal */}
                <SaveAsTemplateModal
                  agencyId={agencyId!}
                  createdBy={userId!}
                  isOpen={isSaveTemplateModalOpen}
                  onClose={() => setIsSaveTemplateModalOpen(false)}
                  onSave={() => {
                    setIsSaveTemplateModalOpen(false);
                    // Optionally show success message
                  }}
                />
              </motion.div>
            )}

            {/* Platform Connection Modal */}
            <PlatformConnectionModal
              isOpen={isPlatformModalOpen}
              onClose={() => setIsPlatformModalOpen(false)}
              agencyId={agencyId}
              onConnectionComplete={() => {
                // Refetch platform connections after modal closes - use same key as connections page
                queryClient.invalidateQueries({ queryKey: ['available-platforms', agencyId] });
              }}
            />
          </AnimatePresence>
        </form>
      </main>
      </div>
    </div>
  );
}

// ============================================================
// PAGE (Wrapper with Provider)
// ============================================================

export default function NewAccessRequestPage() {
  const { userId, orgId } = useAuth();
  const queryClient = useQueryClient();

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // Use orgId if available (matches onboarding flow), otherwise fall back to userId
  const agencyId = orgId || userId;

  return (
    <AccessRequestProvider agencyId={agencyId} queryClient={queryClient}>
      <AccessRequestWizardContent />
    </AccessRequestProvider>
  );
}
