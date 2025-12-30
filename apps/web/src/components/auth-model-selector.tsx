/**
 * AuthModelSelector Component
 *
 * Step 1.5 in access request wizard: Choose authorization model.
 *
 * Two modes:
 * - Delegated Access (recommended): Agency uses their own platform accounts to manage client campaigns
 * - Client Authorization: Client OAuths their accounts to agency for API access
 */

'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Users, Building2, Star } from 'lucide-react';
import { AuthModel, AUTH_MODEL_DESCRIPTIONS } from '@agency-platform/shared';

interface AuthModelSelectorProps {
  selectedAuthModel: AuthModel | null;
  onSelectionChange: (authModel: AuthModel) => void;
  disabled?: boolean;
  agencyHasConnectedPlatforms?: Record<string, boolean>; // For delegated access validation
}

const AUTH_MODEL_ICONS: Record<AuthModel, React.ComponentType<{ className?: string }>> = {
  delegated_access: Building2,
  client_authorization: Users,
};

const AUTH_MODEL_COLORS: Record<AuthModel, { bg: string; border: string; text: string; ring: string }> = {
  delegated_access: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    ring: 'ring-indigo-500',
  },
  client_authorization: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    ring: 'ring-blue-500',
  },
};

export function AuthModelSelector({
  selectedAuthModel,
  onSelectionChange,
  disabled = false,
  agencyHasConnectedPlatforms = {},
}: AuthModelSelectorProps) {
  // delegated_access first (recommended)
  const models: AuthModel[] = ['delegated_access', 'client_authorization'];

  // Check if delegated access is available (agency has connected platforms)
  const hasAnyConnectedPlatform = Object.values(agencyHasConnectedPlatforms).some(Boolean);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Choose how you'll access your client's platforms
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model, index) => {
          const Icon = AUTH_MODEL_ICONS[model];
          const isSelected = selectedAuthModel === model;
          const colors = AUTH_MODEL_COLORS[model];
          const info = AUTH_MODEL_DESCRIPTIONS[model];
          const isRecommended = model === 'delegated_access';

          // Delegated access is disabled if agency has no connected platforms
          const isDelegatedAccessDisabled =
            model === 'delegated_access' && !hasAnyConnectedPlatform;

          return (
            <motion.button
              key={model}
              type="button"
              onClick={() => !disabled && !isDelegatedAccessDisabled && onSelectionChange(model)}
              disabled={disabled || isDelegatedAccessDisabled}
              className={`relative p-5 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? `${colors.border} ${colors.bg} ring-2 ring-offset-2 ${colors.ring}`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${
                disabled || isDelegatedAccessDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
              whileHover={!disabled && !isDelegatedAccessDisabled ? { scale: 1.02 } : {}}
              whileTap={!disabled && !isDelegatedAccessDisabled ? { scale: 0.98 } : {}}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                  <Star className="h-3 w-3 fill-amber-800" />
                  {info.recommendation}
                </div>
              )}

              {/* Selected indicator (underneath badge if selected) */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-3 right-3"
                  style={{ right: isRecommended ? '100px' : '12px' }}
                >
                  <CheckCircle2 className={`h-5 w-5 ${colors.text}`} />
                </motion.div>
              )}

              {/* Icon */}
              <div className={`inline-flex p-2 rounded-lg ${colors.bg} mb-3`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>

              {/* Title */}
              <h3 className={`font-semibold text-sm mb-1 ${isSelected ? colors.text : 'text-slate-900'}`}>
                {info.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-600 mb-2">
                {info.description}
              </p>

              {/* Use case */}
              <div className={`text-xs ${colors.text} bg-white/50 rounded px-2 py-1 inline-block`}>
                {info.useCase}
              </div>

              {/* Warning for delegated access without platforms */}
              {model === 'delegated_access' && !hasAnyConnectedPlatform && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Connect platforms first in Settings to use this mode
                  </p>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p className="text-xs text-indigo-900">
          <strong>Recommended:</strong> Delegated Access gives you full UI access to manage client campaigns.
          Use Client Authorization only for API integrations and reporting.
        </p>
      </div>
    </div>
  );
}
