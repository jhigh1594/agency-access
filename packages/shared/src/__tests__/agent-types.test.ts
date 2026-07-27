import { describe, expect, it } from '@jest/globals';
import {
  AgentGrantSchema,
  AgentOperationSchema,
  AgentOperationStatusSchema,
  AgentPermissionSchema,
  AgentRiskClassSchema,
  AgentWorkspacePaginationSchema,
} from '../types';

const grant = {
  id: 'grant-1',
  agencyId: 'agency-1',
  ownerSubject: 'user_123',
  oauthClientId: 'client_123',
  displayName: 'Owner agent',
  permissions: ['workspace:read', 'clients:write'],
  state: 'active',
  createdAt: '2026-07-16T12:00:00.000Z',
  updatedAt: '2026-07-16T12:00:00.000Z',
};

describe('agent-native shared contracts', () => {
  it('parses a least-privilege agent grant', () => {
    expect(AgentGrantSchema.parse(grant)).toEqual(grant);
  });

  it('rejects unknown permissions, risk classes, and lifecycle states', () => {
    expect(() => AgentPermissionSchema.parse('provider_tokens:read')).toThrow();
    expect(() => AgentRiskClassSchema.parse('auto_approve')).toThrow();
    expect(() => AgentOperationStatusSchema.parse('silently_completed')).toThrow();
  });

  it('parses every legal operation lifecycle state', () => {
    const states = [
      'prepared',
      'pending_approval',
      'approved',
      'executing',
      'succeeded',
      'failed_retryable',
      'failed_terminal',
      'declined',
      'expired',
      'canceled',
    ];

    for (const state of states) {
      expect(AgentOperationStatusSchema.parse(state)).toBe(state);
    }
  });

  it('requires approval context for a consequential pending operation', () => {
    const operation = {
      id: 'operation-1',
      grantId: grant.id,
      agencyId: grant.agencyId,
      actionType: 'access_request.dispatch',
      riskClass: 'consequential',
      status: 'pending_approval',
      idempotencyKey: 'dispatch-acme-v1',
      inputHash: 'sha256:abc123',
      approvalPreview: {
        agency: { id: 'agency-1', name: 'Example Agency' },
        client: { id: 'client-1', name: 'Acme' },
        platforms: ['google_ads'],
        permissions: ['Full access'],
        externalEffect: 'Send one authorization request to the client',
        requestingAgent: {
          grantId: 'grant-1',
          oauthClientId: 'client_123',
          displayName: 'Owner agent',
        },
        expiresAt: '2026-07-16T12:15:00.000Z',
        changes: [],
      },
      createdAt: '2026-07-16T12:00:00.000Z',
      updatedAt: '2026-07-16T12:00:00.000Z',
    };

    expect(AgentOperationSchema.parse(operation)).toEqual(operation);
    expect(() => AgentOperationSchema.parse({ ...operation, approvalPreview: undefined })).toThrow();
  });

  it('bounds workspace pagination', () => {
    expect(AgentWorkspacePaginationSchema.parse({ limit: 50 })).toEqual({ limit: 50 });
    expect(() => AgentWorkspacePaginationSchema.parse({ limit: 101 })).toThrow();
  });

  it('does not define secret-bearing fields on grants or operations', () => {
    for (const key of [
      'accessToken',
      'refreshToken',
      'apiKey',
      'webhookSecret',
      'secretId',
      'providerToken',
    ]) {
      expect(() => AgentGrantSchema.parse({ ...grant, [key]: 'must-not-parse' })).toThrow();
    }
  });
});
