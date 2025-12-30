/**
 * Schema Integration Tests
 *
 * Integration tests for database schema constraints, relationships, and defaults.
 * These tests interact with the actual database to validate Prisma schema behavior.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Schema Integration Tests', () => {
  // Test data cleanup
  let testAgencyId: string;
  let testClientId: string;

  beforeEach(async () => {
    // Create a test agency for relationships
    const testAgency = await prisma.agency.create({
      data: {
        name: 'Test Agency',
        email: `test-${Date.now()}@agency.com`, // Unique email
      },
    });
    testAgencyId = testAgency.id;
  });

  afterEach(async () => {
    // Clean up test data in reverse dependency order
    // Skip cleanup if agency was already deleted in the test (cascade delete tests)
    if (!testAgencyId) return;

    await prisma.agencyPlatformConnection.deleteMany({
      where: { agencyId: testAgencyId },
    });
    await prisma.client.deleteMany({
      where: { agencyId: testAgencyId },
    });
    await prisma.agency.delete({
      where: { id: testAgencyId },
    });
  });

  describe('AgencyPlatformConnection Model', () => {
    it('should create a platform connection with required fields', async () => {
      const connection = await prisma.agencyPlatformConnection.create({
        data: {
          agencyId: testAgencyId,
          platform: 'google',
          secretId: 'google_agency_test123',
          status: 'active',
          connectedBy: 'admin@agency.com',
        },
      });

      expect(connection.id).toBeDefined();
      expect(connection.agencyId).toBe(testAgencyId);
      expect(connection.platform).toBe('google');
      expect(connection.secretId).toBe('google_agency_test123');
      expect(connection.status).toBe('active');
      expect(connection.connectedBy).toBe('admin@agency.com');
      expect(connection.connectedAt).toBeInstanceOf(Date);
    });

    it('should enforce unique constraint on agencyId + platform', async () => {
      // Create first connection
      await prisma.agencyPlatformConnection.create({
        data: {
          agencyId: testAgencyId,
          platform: 'meta',
          secretId: 'meta_agency_test123',
          status: 'active',
          connectedBy: 'admin@agency.com',
        },
      });

      // Attempt to create duplicate - should fail
      await expect(
        prisma.agencyPlatformConnection.create({
          data: {
            agencyId: testAgencyId,
            platform: 'meta', // Same platform
            secretId: 'meta_agency_different',
            status: 'active',
            connectedBy: 'admin@agency.com',
          },
        })
      ).rejects.toThrow();
    });

    it('should allow same platform for different agencies', async () => {
      // Create second agency
      const agency2 = await prisma.agency.create({
        data: {
          name: 'Agency 2',
          email: `test2-${Date.now()}@agency.com`,
        },
      });

      // Create connection for first agency
      await prisma.agencyPlatformConnection.create({
        data: {
          agencyId: testAgencyId,
          platform: 'linkedin',
          secretId: 'linkedin_agency_test1',
          status: 'active',
          connectedBy: 'admin1@agency.com',
        },
      });

      // Create connection for second agency (same platform) - should succeed
      const connection2 = await prisma.agencyPlatformConnection.create({
        data: {
          agencyId: agency2.id,
          platform: 'linkedin', // Same platform, different agency
          secretId: 'linkedin_agency_test2',
          status: 'active',
          connectedBy: 'admin2@agency.com',
        },
      });

      expect(connection2.id).toBeDefined();
      expect(connection2.agencyId).toBe(agency2.id);

      // Cleanup
      await prisma.agencyPlatformConnection.deleteMany({
        where: { agencyId: agency2.id },
      });
      await prisma.agency.delete({ where: { id: agency2.id } });
    });

    it('should store optional fields (expiresAt, scope, metadata)', async () => {
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
      const metadata = { businessId: '123456', adAccountId: '789012' };

      const connection = await prisma.agencyPlatformConnection.create({
        data: {
          agencyId: testAgencyId,
          platform: 'google',
          secretId: 'google_agency_test456',
          status: 'active',
          connectedBy: 'admin@agency.com',
          expiresAt,
          scope: 'ads.readonly,analytics.readonly',
          metadata,
        },
      });

      expect(connection.expiresAt).toBeInstanceOf(Date);
      expect(connection.scope).toBe('ads.readonly,analytics.readonly');
      expect(connection.metadata).toEqual(metadata);
    });

    it('should cascade delete when agency is deleted', async () => {
      // Create platform connection
      const connection = await prisma.agencyPlatformConnection.create({
        data: {
          agencyId: testAgencyId,
          platform: 'meta',
          secretId: 'meta_agency_cascade',
          status: 'active',
          connectedBy: 'admin@agency.com',
        },
      });

      // Delete agency
      await prisma.agency.delete({ where: { id: testAgencyId } });

      // Connection should be deleted (cascade)
      const deletedConnection = await prisma.agencyPlatformConnection.findUnique({
        where: { id: connection.id },
      });

      expect(deletedConnection).toBeNull();

      // Clear testAgencyId to avoid double deletion in afterEach
      testAgencyId = '';
    });

    it('should support multiple status values', async () => {
      const statuses = ['active', 'expired', 'invalid', 'revoked'];

      for (const status of statuses) {
        const connection = await prisma.agencyPlatformConnection.create({
          data: {
            agencyId: testAgencyId,
            platform: `platform_${status}`,
            secretId: `secret_${status}`,
            status,
            connectedBy: 'admin@agency.com',
          },
        });

        expect(connection.status).toBe(status);
      }
    });

    it('should track revocation metadata', async () => {
      const connection = await prisma.agencyPlatformConnection.create({
        data: {
          agencyId: testAgencyId,
          platform: 'tiktok',
          secretId: 'tiktok_agency_test',
          status: 'active',
          connectedBy: 'admin@agency.com',
        },
      });

      // Revoke connection
      const revokedAt = new Date();
      const updated = await prisma.agencyPlatformConnection.update({
        where: { id: connection.id },
        data: {
          status: 'revoked',
          revokedAt,
          revokedBy: 'admin@agency.com',
        },
      });

      expect(updated.status).toBe('revoked');
      expect(updated.revokedAt).toBeInstanceOf(Date);
      expect(updated.revokedBy).toBe('admin@agency.com');
    });
  });

  describe('Client Model', () => {
    it('should create a client with required fields', async () => {
      const client = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'John Doe',
          company: 'Acme Corp',
          email: 'john@acme.com',
        },
      });

      expect(client.id).toBeDefined();
      expect(client.agencyId).toBe(testAgencyId);
      expect(client.name).toBe('John Doe');
      expect(client.company).toBe('Acme Corp');
      expect(client.email).toBe('john@acme.com');
      expect(client.language).toBe('en'); // Default value
      expect(client.createdAt).toBeInstanceOf(Date);
      expect(client.updatedAt).toBeInstanceOf(Date);
    });

    it('should enforce unique constraint on agencyId + email', async () => {
      // Create first client
      await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Jane Doe',
          company: 'Beta Inc',
          email: 'jane@beta.com',
        },
      });

      // Attempt to create duplicate email for same agency - should fail
      await expect(
        prisma.client.create({
          data: {
            agencyId: testAgencyId,
            name: 'Jane Doe Updated',
            company: 'Beta Inc',
            email: 'jane@beta.com', // Duplicate email
          },
        })
      ).rejects.toThrow();
    });

    it('should allow same email for different agencies', async () => {
      // Create second agency
      const agency2 = await prisma.agency.create({
        data: {
          name: 'Agency 2',
          email: `test2-${Date.now()}@agency.com`,
        },
      });

      const sharedEmail = 'shared@client.com';

      // Create client for first agency
      const client1 = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Client 1',
          company: 'Company 1',
          email: sharedEmail,
        },
      });

      // Create client for second agency (same email) - should succeed
      const client2 = await prisma.client.create({
        data: {
          agencyId: agency2.id,
          name: 'Client 2',
          company: 'Company 2',
          email: sharedEmail, // Same email, different agency
        },
      });

      expect(client1.email).toBe(sharedEmail);
      expect(client2.email).toBe(sharedEmail);
      expect(client1.agencyId).not.toBe(client2.agencyId);

      // Cleanup
      await prisma.client.deleteMany({ where: { agencyId: agency2.id } });
      await prisma.agency.delete({ where: { id: agency2.id } });
    });

    it('should support language field with default value "en"', async () => {
      // Without language specified - should default to 'en'
      const clientDefault = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Default Lang',
          company: 'Default Co',
          email: 'default@lang.com',
        },
      });

      expect(clientDefault.language).toBe('en');

      // With language specified
      const clientSpanish = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Spanish Client',
          company: 'Spanish Co',
          email: 'spanish@lang.com',
          language: 'es',
        },
      });

      expect(clientSpanish.language).toBe('es');

      // Dutch
      const clientDutch = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Dutch Client',
          company: 'Dutch Co',
          email: 'dutch@lang.com',
          language: 'nl',
        },
      });

      expect(clientDutch.language).toBe('nl');
    });

    it('should store optional website field', async () => {
      const client = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Web Client',
          company: 'Web Co',
          email: 'web@client.com',
          website: 'https://webclient.com',
        },
      });

      expect(client.website).toBe('https://webclient.com');
    });

    it('should cascade delete when agency is deleted', async () => {
      // Create client
      const client = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Cascade Test',
          company: 'Cascade Co',
          email: 'cascade@test.com',
        },
      });

      // Delete agency
      await prisma.agency.delete({ where: { id: testAgencyId } });

      // Client should be deleted (cascade)
      const deletedClient = await prisma.client.findUnique({
        where: { id: client.id },
      });

      expect(deletedClient).toBeNull();

      // Clear testAgencyId to avoid double deletion in afterEach
      testAgencyId = '';
    });

    it('should update updatedAt timestamp on modification', async () => {
      const client = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Update Test',
          company: 'Update Co',
          email: 'update@test.com',
        },
      });

      const originalUpdatedAt = client.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update client
      const updated = await prisma.client.update({
        where: { id: client.id },
        data: { name: 'Updated Name' },
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('AccessRequest Model Updates', () => {
    beforeEach(async () => {
      // Create a test client for access request relationships
      const client = await prisma.client.create({
        data: {
          agencyId: testAgencyId,
          name: 'Request Client',
          company: 'Request Co',
          email: 'request@client.com',
        },
      });
      testClientId = client.id;
    });

    it('should default authModel to "client_authorization"', async () => {
      const accessRequest = await prisma.accessRequest.create({
        data: {
          agencyId: testAgencyId,
          clientName: 'Test Client',
          clientEmail: 'test@client.com',
          uniqueToken: `token_${Date.now()}`,
          platforms: [{ platform: 'meta_ads', accessLevel: 'manage' }],
          status: 'pending',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      expect(accessRequest.authModel).toBe('client_authorization');
    });

    it('should support delegated_access authModel', async () => {
      const accessRequest = await prisma.accessRequest.create({
        data: {
          agencyId: testAgencyId,
          clientName: 'Test Client',
          clientEmail: 'test@client.com',
          uniqueToken: `token_${Date.now()}`,
          platforms: [{ platform: 'google_ads', accessLevel: 'manage' }],
          authModel: 'delegated_access',
          status: 'pending',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      expect(accessRequest.authModel).toBe('delegated_access');
    });

    it('should link to Client model via clientId', async () => {
      const accessRequest = await prisma.accessRequest.create({
        data: {
          agencyId: testAgencyId,
          clientId: testClientId,
          clientName: 'Request Client',
          clientEmail: 'request@client.com',
          uniqueToken: `token_${Date.now()}`,
          platforms: [{ platform: 'linkedin', accessLevel: 'view_only' }],
          status: 'pending',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      expect(accessRequest.clientId).toBe(testClientId);

      // Fetch with client relation
      const requestWithClient = await prisma.accessRequest.findUnique({
        where: { id: accessRequest.id },
        include: { client: true },
      });

      expect(requestWithClient?.client?.name).toBe('Request Client');
      expect(requestWithClient?.client?.company).toBe('Request Co');
    });

    it('should set clientId to null if client is deleted (SetNull)', async () => {
      const accessRequest = await prisma.accessRequest.create({
        data: {
          agencyId: testAgencyId,
          clientId: testClientId,
          clientName: 'Request Client',
          clientEmail: 'request@client.com',
          uniqueToken: `token_${Date.now()}`,
          platforms: [{ platform: 'meta_ads', accessLevel: 'manage' }],
          status: 'pending',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Delete client
      await prisma.client.delete({ where: { id: testClientId } });

      // Fetch access request - clientId should be null
      const updatedRequest = await prisma.accessRequest.findUnique({
        where: { id: accessRequest.id },
      });

      expect(updatedRequest?.clientId).toBeNull();
      expect(updatedRequest?.clientName).toBe('Request Client'); // Name preserved
    });
  });

  describe('AuditLog Model Updates', () => {
    it('should support agencyConnectionId field', async () => {
      const connection = await prisma.agencyPlatformConnection.create({
        data: {
          agencyId: testAgencyId,
          platform: 'google',
          secretId: 'google_audit_test',
          status: 'active',
          connectedBy: 'admin@agency.com',
        },
      });

      const auditLog = await prisma.auditLog.create({
        data: {
          agencyId: testAgencyId,
          action: 'AGENCY_CONNECTED',
          userEmail: 'admin@agency.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          agencyConnectionId: connection.id,
          metadata: { platform: 'google', scope: 'ads.readonly' },
        },
      });

      expect(auditLog.agencyConnectionId).toBe(connection.id);
      expect(auditLog.action).toBe('AGENCY_CONNECTED');
    });

    it('should support new audit actions (AGENCY_CONNECTED, AGENCY_DISCONNECTED, AGENCY_TOKEN_REFRESHED)', async () => {
      const actions = ['AGENCY_CONNECTED', 'AGENCY_DISCONNECTED', 'AGENCY_TOKEN_REFRESHED'];

      for (const action of actions) {
        const log = await prisma.auditLog.create({
          data: {
            agencyId: testAgencyId,
            action,
            userEmail: 'admin@agency.com',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          },
        });

        expect(log.action).toBe(action);
      }
    });
  });
});
