'use client';

/**
 * Marketing-only alias for the app-wide AnimationGate.
 * v2.0: the gate is mounted by the ROOT layout (src/app/layout.tsx) so
 * authenticated route groups animate skeletons and gate reveals too.
 * Kept as a re-export so existing marketing-layout usage and its
 * motion test mocks stay valid. Do not add new logic here.
 */
export { AnimationGate as MarketingShellEffects } from '@/components/animation-gate';
