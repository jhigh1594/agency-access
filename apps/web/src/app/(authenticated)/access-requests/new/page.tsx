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
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, Loader2, AlertCircle, Save } from 'lucide-react';
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
import { getPlatformCount, getGroupCount } from '@/lib/transform-platforms';
import type { AccessRequestTemplate } from '@agency-platform/shared';

// ============================================================
// WIZARD CONTENT (Inner Component)
// ============================================================

function AccessRequestWizardContent() {
  const { userId } = useAuth();
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

  // Calculate platform counts
  const platformCount = useMemo(
    () => getPlatformCount(state.selectedPlatforms),
    [state.selectedPlatforms]
  );
  const groupCount = useMemo(() => getGroupCount(state.selectedPlatforms), [state.selectedPlatforms]);

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

  // Step labels (0-5 with auth model)
  const steps = [
    { number: 0, label: 'Template' },
    { number: 1, label: 'Client' },
    { number: 2, label: 'Auth Mode' },
    { number: 3, label: 'Platforms' },
    { number: 4, label: 'Form Fields' },
    { number: 5, label: 'Branding' },
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

        {/* Enhanced Progress Steps */}
        <div className="py-8">
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <Fragment key={step.number}>
              <motion.div
                className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step.number < state.currentStep
                    ? 'bg-indigo-600 text-white shadow-md'
                    : step.number === state.currentStep
                    ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100'
                    : 'bg-slate-200 text-slate-600'
                }`}
                animate={
                  step.number === state.currentStep
                    ? { scale: [1, 1.05, 1], transition: { duration: 0.5 } }
                    : {}
                }
              >
                {step.number < state.currentStep ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <Check className="h-5 w-5" />
                  </motion.div>
                ) : (
                  step.number
                )}
              </motion.div>
              {index < steps.length - 1 && (
                <div className="relative h-0.5 w-16 bg-slate-200 overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-indigo-600"
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: step.number < state.currentStep ? 1 : 0,
                    }}
                    transition={{ duration: 0.5 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>
        <div className="flex items-center justify-center gap-8 mt-3 text-sm">
          {steps.map((step) => (
            <span
              key={step.number}
              className={`transition-colors ${
                step.number === state.currentStep
                  ? 'text-indigo-600 font-semibold'
                  : step.number < state.currentStep
                  ? 'text-slate-500'
                  : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <form id="access-request-form" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 0: Template Selection */}
            {state.currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <TemplateSelector
                  agencyId={userId!}
                  selectedTemplate={state.selectedTemplate}
                  onSelect={handleTemplateSelect}
                />

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 1: Client Selection */}
            {state.currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Client Information</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Select an existing client or create a new one
                </p>

                <ClientSelector
                  agencyId={userId!}
                  value={state.client?.id}
                  onSelect={updateClient}
                />

                {state.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{state.error}</p>
                  </motion.div>
                )}

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="px-6 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!currentStepValid}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Auth Model Selection */}
            {state.currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Authorization Model</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Choose how clients will authorize access to their platforms
                </p>

                <AuthModelSelector
                  selectedAuthModel={state.authModel}
                  onSelectionChange={updateAuthModel}
                />

                {/* Delegated Access helper - show platform connection modal button */}
                {state.authModel === 'delegated_access' && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-purple-900 font-medium mb-1">
                          Delegated Access requires platform connections
                        </p>
                        <p className="text-xs text-purple-700">
                          Your agency must have connected platforms to grant access to clients
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPlatformModalOpen(true)}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Manage Platforms
                      </button>
                    </div>
                  </div>
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
                    disabled={!state.authModel}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Platforms & Access Level */}
            {state.currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <div className="space-y-8">
                  {/* Access Level Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      Access Level for All Platforms
                    </h2>
                    <p className="text-sm text-slate-600 mb-4">
                      This access level will apply to all selected platforms
                    </p>
                    <AccessLevelSelector
                      selectedAccessLevel={state.globalAccessLevel ?? undefined}
                      onSelectionChange={updateAccessLevel}
                    />
                  </div>

                  {/* Platform Selection Section */}
                  <div>
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">Select Platforms</h2>
                        {platformCount > 0 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-600 mt-1"
                          >
                            <span className="font-semibold text-indigo-600">
                              {platformCount} {platformCount === 1 ? 'product' : 'products'}
                            </span>{' '}
                            selected across {groupCount} {groupCount === 1 ? 'platform' : 'platforms'}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    <HierarchicalPlatformSelector
                      selectedPlatforms={state.selectedPlatforms}
                      onSelectionChange={updatePlatforms}
                    />
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
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    disabled={!currentStepValid}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Intake Form Builder */}
            {state.currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Intake Form Fields</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Collect additional information from clients during authorization
                </p>

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

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Branding */}
            {state.currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Branding <span className="text-slate-500 font-normal">(Optional)</span>
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Customize the authorization page with your agency branding
                </p>

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
                    <label
                      htmlFor="primaryColor"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
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
                </div>

                {/* Preview */}
                {(state.branding.logoUrl || state.branding.primaryColor !== '#6366f1') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 p-4 border border-slate-200 rounded-lg overflow-hidden"
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-6 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      disabled={state.submitting}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSaveTemplateModalOpen(true)}
                      className="px-4 py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2"
                      disabled={state.submitting}
                    >
                      <Save className="h-4 w-4" />
                      Save as Template
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={state.submitting}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    {state.submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {state.submitting ? 'Creating Request...' : 'Create Request'}
                  </button>
                </div>

                {/* Save as Template Modal */}
                <SaveAsTemplateModal
                  agencyId={userId!}
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
              onConnectionComplete={() => {
                // Refetch platform connections after modal closes
                queryClient.invalidateQueries({ queryKey: ['platform-connections', userId] });
              }}
            />
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// PAGE (Wrapper with Provider)
// ============================================================

export default function NewAccessRequestPage() {
  const { userId } = useAuth();

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <AccessRequestProvider agencyId={userId}>
      <AccessRequestWizardContent />
    </AccessRequestProvider>
  );
}
