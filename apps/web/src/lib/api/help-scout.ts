import { z } from 'zod';
import { authorizedApiFetch } from './authorized-api-fetch';

const HelpScoutBeaconIdentitySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  signature: z.string().min(1),
});

export type HelpScoutBeaconIdentity = z.infer<typeof HelpScoutBeaconIdentitySchema>;

export async function loadHelpScoutIdentity({
  getToken,
}: {
  getToken: () => Promise<string | null>;
}): Promise<HelpScoutBeaconIdentity> {
  const response = await authorizedApiFetch<{ data: unknown; error: null }>('/api/help-scout/beacon', {
    getToken,
  });

  return HelpScoutBeaconIdentitySchema.parse(response.data);
}
