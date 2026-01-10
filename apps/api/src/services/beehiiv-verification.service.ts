import { prisma } from '../lib/prisma.js';
import { beehiivConnector } from './connectors/beehiiv.js';

/**
 * Beehiiv Verification Service
 *
 * Handles Beehiiv's unique team invitation workflow:
 * 1. Client adds agency as team member in Beehiiv UI
 * 2. Agency provides their Beehiiv API key
 * 3. Service verifies agency can access client's publication
 * 4. Agency's API key stored in Infisical
 * 5. Connection record created in database
 */
export class BeehiivVerificationService {
  /**
   * Verify agency has access to client's Beehiiv publication
   *
   * This method:
   * 1. Verifies agency API key can access client's publication
   * 2. Stores agency API key securely in Infisical
   * 3. Creates or updates agency platform connection record
   *
   * @param agencyId - Agency UUID
   * @param clientPublicationId - Beehiiv publication ID (e.g., "pub123")
   * @param agencyApiKey - Agency's Beehiiv API key
   * @returns Connection ID if successful, error message otherwise
   */
  async verifyAgencyAccess(
    agencyId: string,
    clientPublicationId: string,
    agencyApiKey: string
  ): Promise<{ success: boolean; connectionId?: string; error?: string }> {
    try {
      // Step 1: Verify agency API key can access client's publication
      const accessResult = await beehiivConnector.verifyTeamAccess(
        agencyApiKey,
        clientPublicationId
      );

      if (!accessResult.hasAccess) {
        return {
          success: false,
          error:
            'Agency does not have access to this publication. ' +
            'Ensure the client has added you as a team member in Beehiiv.',
        };
      }

      // Step 2: Store agency API key in Infisical
      const secretId = await beehiivConnector.storeAgencyApiKey(agencyId, agencyApiKey);

      // Step 3: Create or update agency platform connection
      const connection = await prisma.agencyPlatformConnection.upsert({
        where: {
          agencyId_platform: {
            agencyId,
            platform: 'beehiiv',
          },
        },
        create: {
          agencyId,
          platform: 'beehiiv',
          connectionMode: 'oauth',
          secretId,
          status: 'active',
          verificationStatus: 'verified',
          lastVerifiedAt: new Date(),
          connectedBy: 'system@authhub.com', // TODO: Get actual user email from request
          metadata: {
            publicationId: clientPublicationId,
            publicationName: accessResult.publication?.name,
          },
        },
        update: {
          secretId,
          status: 'active',
          verificationStatus: 'verified',
          lastVerifiedAt: new Date(),
          metadata: {
            publicationId: clientPublicationId,
            publicationName: accessResult.publication?.name,
          },
        },
      });

      return {
        success: true,
        connectionId: connection.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Verify agency connection is still valid
   *
   * Used for periodic re-verification of agency connections.
   *
   * @param connectionId - Agency platform connection ID
   * @returns Whether connection is still valid
   */
  async verifyConnection(connectionId: string): Promise<boolean> {
    try {
      const connection = await prisma.agencyPlatformConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection || connection.platform !== 'beehiiv') {
        return false;
      }

      const agencyApiKey = await beehiivConnector.getAgencyApiKey(connection.agencyId);
      const isValid = await beehiivConnector.verifyToken(agencyApiKey);

      if (isValid) {
        // Update last verified timestamp
        await prisma.agencyPlatformConnection.update({
          where: { id: connectionId },
          data: { lastVerifiedAt: new Date() },
        });
      }

      return isValid;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance for use throughout the application
 */
export const beehiivVerificationService = new BeehiivVerificationService();
