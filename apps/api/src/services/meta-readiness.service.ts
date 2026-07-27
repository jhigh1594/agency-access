import { MetaConnector } from './connectors/meta.js';
import { env } from '@/lib/env.js';
import { prisma } from '@/lib/prisma';
import { agencyPlatformService } from './agency-platform.service.js';
import { metaSystemUserService } from './meta-system-user.service.js';

type ReadinessCheck = {
  id: string;
  label: string;
  status: 'pass' | 'action_needed' | 'unavailable';
  message: string;
};

async function checkDestination(agencyId: string, destinationId: string) {
  const destination = await prisma.metaAgencyDestination.findFirst({
    where: { id: destinationId, agencyId },
    include: { agencyConnection: true },
  });

  if (!destination) {
    return {
      data: null,
      error: { code: 'DESTINATION_NOT_FOUND', message: 'Meta receiving destination not found' },
    };
  }

  const connection = destination.agencyConnection;
  const metadata = connection.metadata && typeof connection.metadata === 'object' && !Array.isArray(connection.metadata)
    ? connection.metadata as Record<string, any>
    : {};
  const visibleBusinesses = Array.isArray(metadata.metaBusinessAccounts?.businesses)
    ? metadata.metaBusinessAccounts.businesses
    : [];
  const hasDiscoverySnapshot = metadata.metaBusinessAccounts !== undefined;
  const visible = visibleBusinesses.some((business: any) => business?.id === destination.businessId);
  const scopes = new Set((connection.scope || '').split(',').map((scope) => scope.trim()).filter(Boolean));
  const requiredScopes = MetaConnector.DEFAULT_SCOPES;
  const missingScopes = requiredScopes.filter((scope) => !scopes.has(scope));
  const systemUserReady = metadata.selectedBusinessId === destination.businessId
    && metadata.partnerAdminSystemUserStatus === 'ready'
    && typeof metadata.partnerAdminSystemUserTokenSecretId === 'string';
  let providerAuthorityProven = false;
  let providerAuthorityMessage = 'Provider authority has not been verified.';
  if (connection.status === 'active' && systemUserReady && typeof metadata.systemUserId === 'string') {
    const tokenResult = await agencyPlatformService.getValidToken(agencyId, 'meta');
    if (!tokenResult.error && tokenResult.data) {
      const systemUsersResult = await metaSystemUserService.getSystemUsers(
        destination.businessId,
        tokenResult.data
      );
      const provisionedUser = !systemUsersResult.error
        ? systemUsersResult.data?.find((user) => user.id === metadata.systemUserId)
        : undefined;
      providerAuthorityProven = provisionedUser?.role?.toUpperCase() === 'ADMIN';
      providerAuthorityMessage = providerAuthorityProven
        ? 'Meta returned the provisioned system user with administrator authority for this portfolio.'
        : systemUsersResult.error?.message || (provisionedUser
          ? 'The provisioned system user does not have administrator authority.'
          : 'Meta did not return the provisioned system user.');
    } else {
      providerAuthorityMessage = tokenResult.error?.message || 'The agency Meta token could not be read.';
    }
  }

  const checks: ReadinessCheck[] = [
    {
      id: 'oauth_connection',
      label: 'Meta connection',
      status: connection.status === 'active' && Boolean(connection.secretId) ? 'pass' : 'action_needed',
      message: connection.status === 'active' && connection.secretId ? 'Meta OAuth is active.' : 'Reconnect Meta before using this destination.',
    },
    {
      id: 'portfolio_visibility',
      label: 'Portfolio visibility',
      status: hasDiscoverySnapshot && !visible ? 'unavailable' : 'pass',
      message: hasDiscoverySnapshot && !visible ? 'This portfolio is no longer visible to the connected Meta identity.' : 'The portfolio is visible to the connected identity.',
    },
    {
      id: 'business_login_config',
      label: 'Business Login configuration',
      status: env.META_APP_ID && env.META_APP_SECRET && env.META_LOGIN_FOR_BUSINESS_CONFIG_ID ? 'pass' : 'action_needed',
      message: env.META_LOGIN_FOR_BUSINESS_CONFIG_ID ? 'Meta Business Login identifiers are configured.' : 'Add the Meta Login for Business configuration ID.',
    },
    {
      id: 'required_scopes',
      label: 'Required scopes',
      status: missingScopes.length === 0 ? 'pass' : 'action_needed',
      message: missingScopes.length === 0 ? 'Required Meta scopes are present.' : `Reconnect Meta with: ${missingScopes.join(', ')}.`,
    },
    {
      id: 'provider_authority',
      label: 'Provider-backed authority',
      status: providerAuthorityProven ? 'pass' : 'action_needed',
      message: providerAuthorityMessage,
    },
    {
      id: 'system_user_capability',
      label: 'Delegated system user',
      status: systemUserReady ? 'pass' : 'action_needed',
      message: systemUserReady ? 'The partner system-user token is ready.' : 'Select and provision this portfolio before automatic grants.',
    },
    {
      id: 'manual_partner_id',
      label: 'Manual partner fallback',
      status: destination.businessId ? 'pass' : 'action_needed',
      message: destination.businessId ? `Partner portfolio ID ${destination.businessId} is available.` : 'A receiving portfolio ID is required.',
    },
  ];

  const readinessStatus = checks.some((check) => check.status === 'unavailable')
    ? 'unavailable'
    : checks.every((check) => check.status === 'pass')
      ? 'ready'
      : 'action_needed';
  const now = new Date();
  const readinessDetails = { checks };
  const updated = await prisma.metaAgencyDestination.update({
    where: { id: destination.id },
    data: {
      readinessStatus,
      readinessDetails,
      lastReadinessCheckAt: now,
      ...(readinessStatus === 'ready' ? { lastVerifiedAt: now } : {}),
    },
  });

  return { data: { ...updated, readinessDetails }, error: null };
}

export const metaReadinessService = { checkDestination };
