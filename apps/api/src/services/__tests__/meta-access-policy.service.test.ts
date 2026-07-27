import { describe, expect, it } from 'vitest';
import { metaAccessPolicyService } from '../meta-access-policy.service.js';

describe('metaAccessPolicyService', () => {
  it.each([
    'meta_run_ads',
    'meta_organic_social',
    'meta_view_only_audit',
  ] as const)('derives a deterministic versioned snapshot for %s', (recipeId) => {
    const first = metaAccessPolicyService.createSnapshot({
      recipeId,
      destinationId: 'destination-1',
    });
    const second = metaAccessPolicyService.createSnapshot({
      recipeId,
      destinationId: 'destination-1',
    });

    expect(first).toEqual(second);
    expect(first.recipeVersion).toBe(1);
    expect(first.destinationId).toBe('destination-1');
  });

  it('keeps view-only audit free from mutating provider tasks', () => {
    const snapshot = metaAccessPolicyService.createSnapshot({
      recipeId: 'meta_view_only_audit',
      destinationId: 'destination-1',
    });
    const tasks = snapshot.requirements.flatMap((requirement) => requirement.providerTasks);

    expect(tasks).toEqual(expect.arrayContaining(['ANALYZE']));
    expect(tasks).not.toEqual(
      expect.arrayContaining(['MANAGE', 'ADVERTISE', 'CREATE_CONTENT', 'MODERATE', 'MESSAGING'])
    );
  });

  it('fails closed for an unknown capability', () => {
    expect(() => metaAccessPolicyService.resolveCapabilities(['unknown_capability' as never])).toThrow(
      'Unsupported Meta capability'
    );
  });

  it('rejects caller-supplied tasks and unsupported recipes', () => {
    expect(() =>
      metaAccessPolicyService.parseRequestInput({
        recipeId: 'meta_run_ads',
        destinationId: 'destination-1',
        providerTasks: ['MANAGE'],
      })
    ).toThrow();
    expect(() =>
      metaAccessPolicyService.parseRequestInput({
        recipeId: 'meta_custom_admin',
        destinationId: 'destination-1',
      })
    ).toThrow();
  });
});
