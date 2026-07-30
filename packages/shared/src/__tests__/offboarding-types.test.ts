import { describe, expect, it } from 'vitest';
import {
  AgentPermissionSchema,
  OffboardingItemClassificationSchema,
  OffboardingItemStatusSchema,
  OffboardingRunStatusSchema,
  OffboardingProviderOutcomeSchema,
  OffboardingItemSchema,
  OffboardingRunSchema,
} from '../types';

describe('google client offboarding shared contracts', () => {
  it('parses every legal offboarding run status', () => {
    const states = [
      'prepared',
      'awaiting_approval',
      'queued',
      'executing',
      'receipt_pending',
      'completed',
      'completed_with_manual_follow_up',
      'incomplete',
      'canceled',
    ];
    for (const s of states) {
      expect(OffboardingRunStatusSchema.parse(s)).toBe(s);
    }
    expect(() => OffboardingRunStatusSchema.parse('manual_action_required')).toThrow();
  });

  it('parses every legal offboarding item status', () => {
    const states = [
      'pending',
      'revoked_verified',
      'already_absent',
      'awaiting_client_approval',
      'manual_action_required',
      'reconnect_required',
      'not_safely_reversible',
      'failed_retryable',
      'failed_terminal',
      'attestation_recorded',
    ];
    for (const s of states) {
      expect(OffboardingItemStatusSchema.parse(s)).toBe(s);
    }
  });

  it('parses every legal item classification', () => {
    const classes = [
      'eligible_automatic',
      'manual_action_required',
      'not_safely_reversible',
      'reconnect_required',
    ];
    for (const c of classes) {
      expect(OffboardingItemClassificationSchema.parse(c)).toBe(c);
    }
  });

  it('parses every legal provider outcome', () => {
    const outcomes = [
      'deleted',
      'already_absent',
      'approval_pending',
      'manual_handoff',
      'reconnect_required',
      'transient_failure',
      'terminal_failure',
      'verification_failed',
    ];
    for (const o of outcomes) {
      expect(OffboardingProviderOutcomeSchema.parse(o)).toBe(o);
    }
  });

  it('includes offboarding agent permission', () => {
    expect(AgentPermissionSchema.parse('offboarding:read')).toBe('offboarding:read');
    expect(AgentPermissionSchema.parse('offboarding:prepare')).toBe('offboarding:prepare');
  });

  it('parses a minimal offboarding item', () => {
    const item = {
      id: 'item-1',
      runId: 'run-1',
      productId: 'google_ads',
      classification: 'eligible_automatic' as const,
      status: 'pending' as const,
      assetLabel: 'Customer ID: 123-456-7890',
      grantId: 'grant-1',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    };
    expect(OffboardingItemSchema.parse(item)).toMatchObject(item);
  });

  it('parses a minimal offboarding run', () => {
    const run = {
      id: 'run-1',
      agencyId: 'agency-1',
      connectionId: 'conn-1',
      status: 'prepared' as const,
      idempotencyKey: 'key-1',
      snapshotHash: 'hash-1',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
    };
    expect(OffboardingRunSchema.parse(run)).toMatchObject(run);
  });

  it('rejects unknown classifications and outcomes', () => {
    expect(() => OffboardingItemClassificationSchema.parse('maybe_automatic')).toThrow();
    expect(() => OffboardingProviderOutcomeSchema.parse('unknown_error')).toThrow();
  });
});
