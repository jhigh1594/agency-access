import { env } from '@/lib/env.js';

export const agentRolloutService = {
  isAgencyAllowed(agencyId: string): boolean {
    return env.AGENT_NATIVE_ENABLED && env.AGENT_NATIVE_AGENCY_ALLOWLIST.includes(agencyId);
  },
};
