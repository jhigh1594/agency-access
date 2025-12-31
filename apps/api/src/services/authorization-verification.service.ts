/**
 * Authorization Verification Service
 *
 * Handles API-based verification for platform-native authorization flow.
 *
 * When clients confirm they've granted access in their platform UI,
 * this service:
 * 1. Creates a verification record
 * 2. Queues a background job to verify via agency's OAuth token
 * 3. Tracks verification attempts and results
 * 4. Updates connection status based on verification
 */

import { prisma } from '@/lib/prisma';
import { infisical } from '@/lib/infisical';
import { metaConnector } from './connectors/meta.js';
import { googleAdsConnector } from './connectors/google-ads.js';
import { ga4Connector } from './connectors/ga4.js';
import type { AccessLevel } from '@agency-platform/shared';

// Validation schemas
const initiateVerificationSchema = {
  accessRequestId: 'string',
  platform: 'string',
  clientEmail: 'string',
  requiredAccessLevel: 'string' as AccessLevel,
};

export type InitiateVerificationInput = typeof initiateVerificationSchema;

interface VerificationResult {
  hasAccess: boolean;
  accessLevel: AccessLevel;
  accounts?: Array<{
    id: string;
    name: string;
    status: string;
    permissions: string[];
  }>;
  properties?: Array<{
    id: string;
    name: string;
    displayName: string;
    permissions: string[];
  }>;
  businessName?: string;
  assets?: Array<{
    type: string;
    id: string;
    name: string;
    permissions?: string[];
  }>;
  error?: string;
}

/**
 * Initiate verification after client confirms authorization
 *
 * Creates a verification record and queues background job.
 *
 * @param input - Verification request data
 * @returns Created verification record
 */
export async function initiateVerification(input: InitiateVerificationInput) {
  try {
    // Validate input
    if (!input.accessRequestId || !input.platform || !input.clientEmail) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
        },
      };
    }

    // Get access request
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: input.accessRequestId },
      include: { connection: true },
    });

    if (!accessRequest) {
      return {
        data: null,
        error: {
          code: 'ACCESS_REQUEST_NOT_FOUND',
          message: 'Access request not found',
        },
      };
    }

    // Check if already verified
    const existingVerification = await prisma.authorizationVerification.findFirst({
      where: {
        connectionId: accessRequest.connection?.id || '',
        platform: input.platform,
      },
    });

    if (existingVerification && existingVerification.status === 'verified') {
      return {
        data: null,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Platform already verified',
        },
      };
    }

    // Find agency's OAuth connection for this platform
    const platformGroup = input.platform.split('_')[0]; // 'google' from 'google_ads', 'ga4'
    const agencyConnection = await prisma.agencyPlatformConnection.findFirst({
      where: {
        agencyId: accessRequest.agencyId,
        platform: platformGroup,
        connectionMode: 'oauth', // Must have OAuth token for verification
        status: 'active',
      },
    });

    if (!agencyConnection || !agencyConnection.secretId) {
      return {
        data: null,
        error: {
          code: 'AGENCY_OAUTH_REQUIRED',
          message: 'Agency must connect via OAuth to verify client access',
        },
      };
    }

    // Get agency's platform identity (for Meta we need businessId)
    const agencyIdentity: {
      email?: string;
      businessId?: string;
    } = {
      email: agencyConnection.agencyEmail || undefined,
      businessId: agencyConnection.businessId || undefined,
    };

    // Create or update verification record
    const verification = await prisma.authorizationVerification.upsert({
      where: {
        connectionId_platform: {
          connectionId: accessRequest.connection?.id || '',
          platform: input.platform,
        },
      },
      create: {
        accessRequestId: input.accessRequestId,
        platform: input.platform,
        connectionId: accessRequest.connection?.id || '',
        status: 'pending',
        attempts: 0,
        agencyConnectionId: agencyConnection.id,
      },
      update: {
        status: 'pending',
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    // Queue background verification job
    await queueVerificationJob(verification.id, {
      accessRequestId: input.accessRequestId,
      platform: input.platform,
      clientEmail: input.clientEmail,
      requiredAccessLevel: input.requiredAccessLevel,
      agencyConnectionId: agencyConnection.id,
      agencyIdentity,
    });

    return {
      data: {
        id: verification.id,
        status: 'verifying',
        message: 'Verification initiated',
        estimatedTime: 30, // seconds
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to initiate verification',
        details: String(error),
      },
    };
  }
}

/**
 * Execute verification (called by background job)
 *
 * Uses agency's OAuth token to query platform API and verify access.
 *
 * @param verificationId - Verification record ID
 * @param jobData - Job data from queue
 */
export async function executeVerification(
  verificationId: string,
  jobData: {
    accessRequestId: string;
    platform: string;
    clientEmail: string;
    requiredAccessLevel: AccessLevel;
    agencyConnectionId: string;
    agencyIdentity: {
      email?: string;
      businessId?: string;
    };
  }
): Promise<void> {
  try {
    // Get verification record
    const verification = await prisma.authorizationVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      console.error(`Verification not found: ${verificationId}`);
      return;
    }

    // Update status to verifying
    await prisma.authorizationVerification.update({
      where: { id: verificationId },
      data: { status: 'verifying' },
    });

    // Get agency connection
    const agencyConnection = await prisma.agencyPlatformConnection.findUnique({
      where: { id: jobData.agencyConnectionId },
    });

    if (!agencyConnection || !agencyConnection.secretId) {
      throw new Error('Agency OAuth connection not found');
    }

    // Get agency's OAuth token from Infisical
    const tokens = await infisical.getOAuthTokens(agencyConnection.secretId);

    if (!tokens.accessToken) {
      throw new Error('Agency access token not available');
    }

    // Call platform-specific verification
    const result = await verifyPlatformAccess(
      jobData.platform,
      tokens.accessToken,
      jobData,
      verification.id
    );

    // Update verification record with results
    await prisma.authorizationVerification.update({
      where: { id: verificationId },
      data: {
        status: result.hasAccess ? 'verified' : 'failed',
        verifiedAt: result.hasAccess ? new Date() : undefined,
        verifiedPermissions: result.hasAccess ? (result as any) : undefined,
        errorMessage: result.error,
        lastAttemptAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    // If verified, update access request status
    if (result.hasAccess) {
      await updateAccessRequestStatus(jobData.accessRequestId);
    }
  } catch (error) {
    console.error(`Verification failed for ${verificationId}:`, error);

    // Update verification record with error
    await prisma.authorizationVerification.update({
      where: { id: verificationId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastAttemptAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  }
}

/**
 * Verify platform access using appropriate connector
 */
async function verifyPlatformAccess(
  platform: string,
  accessToken: string,
  jobData: {
    clientEmail: string;
    requiredAccessLevel: AccessLevel;
    agencyIdentity: {
      email?: string;
      businessId?: string;
    };
  },
  verificationId: string
): Promise<VerificationResult> {
  switch (platform) {
    case 'meta_ads':
      return await metaConnector.verifyClientAccess(
        accessToken,
        jobData.agencyIdentity.businessId || '',
        jobData.clientEmail,
        jobData.requiredAccessLevel
      );

    case 'google_ads':
      return await googleAdsConnector.verifyClientAccess(
        accessToken,
        jobData.clientEmail,
        jobData.requiredAccessLevel
      );

    case 'ga4':
      // For GA4, we need the property ID which should come from confirmation data
      // For MVP, we'll use the agency's identity
      return await ga4Connector.verifyClientAccess(
        accessToken,
        jobData.clientEmail,
        '', // Property ID would come from client confirmation data
        jobData.requiredAccessLevel
      );

    default:
      return {
        hasAccess: false,
        accessLevel: 'read_only',
        error: `Unsupported platform: ${platform}`,
      };
  }
}

/**
 * Update access request status after successful verification
 */
async function updateAccessRequestStatus(accessRequestId: string): Promise<void> {
  // Get all verifications for this access request
  const verifications = await prisma.authorizationVerification.findMany({
    where: { accessRequestId },
  });

  // Count verified vs total
  const verifiedCount = verifications.filter((v: any) => v.status === 'verified').length;
  const totalCount = verifications.length;

  // Determine new status
  let newStatus: 'pending' | 'partial' | 'completed' = 'pending';
  if (verifiedCount === totalCount && totalCount > 0) {
    newStatus = 'completed';
  } else if (verifiedCount > 0) {
    newStatus = 'partial';
  }

  // Update access request
  await prisma.accessRequest.update({
    where: { id: accessRequestId },
    data: {
      status: newStatus,
      ...(newStatus === 'completed' ? { authorizedAt: new Date() } : {}),
    },
  });
}

/**
 * Get current verification status
 *
 * @param accessRequestId - Access request ID
 * @param platform - Platform to check
 * @returns Verification status
 */
export async function getVerificationStatus(
  accessRequestId: string,
  platform: string
) {
  try {
    const verification = await prisma.authorizationVerification.findFirst({
      where: { accessRequestId, platform },
    });

    if (!verification) {
      return {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Verification not found',
        },
      };
    }

    return {
      data: {
        id: verification.id,
        status: verification.status,
        attempts: verification.attempts,
        lastAttemptAt: verification.lastAttemptAt,
        verifiedAt: verification.verifiedAt,
        permissions: verification.verifiedPermissions,
        errorMessage: verification.errorMessage,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get verification status',
      },
    };
  }
}

/**
 * Queue verification background job
 *
 * @param verificationId - Verification record ID
 * @param jobData - Job data
 */
async function queueVerificationJob(
  verificationId: string,
  jobData: {
    accessRequestId: string;
    platform: string;
    clientEmail: string;
    requiredAccessLevel: AccessLevel;
    agencyConnectionId: string;
    agencyIdentity: {
      email?: string;
      businessId?: string;
    };
  }
): Promise<void> {
  // Import queue dynamically to avoid circular dependencies
  const { queueVerification } = await import('../lib/verification-queue');

  await queueVerification(verificationId, jobData);
}

/**
 * Authorization Verification Service
 * Exports all verification service functions
 */
export const authorizationVerificationService = {
  initiateVerification,
  executeVerification,
  getVerificationStatus,
};
