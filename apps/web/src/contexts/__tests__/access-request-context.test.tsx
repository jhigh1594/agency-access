/**
 * Access Request Context Unit Tests
 *
 * Phase 5: Tests for context state management, validation,
 * and data transformation logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  AccessRequestProvider,
  useAccessRequest,
} from '../access-request-context';
import * as accessRequestsApi from '@/lib/api/access-requests';
import type { Client } from '@/components/client-selector';
import type { AccessLevel } from '@agency-platform/shared';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API client
vi.mock('@/lib/api/access-requests');

describe('AccessRequestContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AccessRequestProvider agencyId="agency-123">{children}</AccessRequestProvider>
  );

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAccessRequest(), { wrapper });

    expect(result.current.state).toEqual({
      client: null,
      selectedPlatforms: {},
      globalAccessLevel: null,
      intakeFields: [
        {
          id: '1',
          label: 'Company Website',
          type: 'url',
          required: true,
          order: 0,
        },
      ],
      branding: {
        logoUrl: '',
        primaryColor: '#6366f1',
        subdomain: '',
      },
      currentStep: 1,
      submitting: false,
      error: null,
    });
  });

  describe('updateClient', () => {
    it('should update client in state', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      const client: Client = {
        id: 'client-123',
        name: 'Test Client',
        email: 'test@example.com',
        agencyId: 'agency-123',
      };

      act(() => {
        result.current.updateClient(client);
      });

      expect(result.current.state.client).toEqual(client);
    });
  });

  describe('updatePlatforms', () => {
    it('should update selected platforms', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      const platforms = {
        google: ['google_ads', 'ga4'],
        meta: ['meta_ads'],
      };

      act(() => {
        result.current.updatePlatforms(platforms);
      });

      expect(result.current.state.selectedPlatforms).toEqual(platforms);
    });
  });

  describe('updateAccessLevel', () => {
    it('should update global access level', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      act(() => {
        result.current.updateAccessLevel('admin');
      });

      expect(result.current.state.globalAccessLevel).toBe('admin');
    });
  });

  describe('updateIntakeFields', () => {
    it('should update intake fields', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      const fields = [
        { label: 'Budget', required: true },
        { label: 'Campaign Goals', required: false },
      ];

      act(() => {
        result.current.updateIntakeFields(fields);
      });

      expect(result.current.state.intakeFields).toEqual(fields);
    });
  });

  describe('updateBranding', () => {
    it('should update branding configuration', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      act(() => {
        result.current.updateBranding({
          logoUrl: 'https://example.com/logo.png',
          primaryColor: '#FF0000',
        });
      });

      expect(result.current.state.branding).toEqual({
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#FF0000',
        subdomain: '', // Should preserve existing subdomain
      });
    });

    it('should partially update branding', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      act(() => {
        result.current.updateBranding({ subdomain: 'acme' });
      });

      expect(result.current.state.branding).toEqual({
        logoUrl: '',
        primaryColor: '#6366f1', // Default
        subdomain: 'acme',
      });
    });
  });

  describe('setStep', () => {
    it('should update current step', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      act(() => {
        result.current.setStep(3);
      });

      expect(result.current.state.currentStep).toBe(3);
    });
  });

  describe('validateStep', () => {
    it('should validate Step 1 - requires client', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // No client selected
      expect(result.current.validateStep(1)).toBe(false);

      // Client selected
      act(() => {
        result.current.updateClient({
          id: 'client-123',
          name: 'Test Client',
          email: 'test@example.com',
          agencyId: 'agency-123',
        });
      });

      expect(result.current.validateStep(1)).toBe(true);
    });

    it('should validate Step 2 - requires platforms and access level', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // No platforms or access level
      expect(result.current.validateStep(2)).toBe(false);

      // Only platforms, no access level
      act(() => {
        result.current.updatePlatforms({ google: ['google_ads'] });
      });
      expect(result.current.validateStep(2)).toBe(false);

      // Only access level, no platforms
      act(() => {
        result.current.updatePlatforms({});
        result.current.updateAccessLevel('admin');
      });
      expect(result.current.validateStep(2)).toBe(false);

      // Both platforms and access level
      act(() => {
        result.current.updatePlatforms({ google: ['google_ads'] });
        result.current.updateAccessLevel('admin');
      });
      expect(result.current.validateStep(2)).toBe(true);
    });

    it('should validate Step 3 - always valid (optional)', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      expect(result.current.validateStep(3)).toBe(true);
    });

    it('should validate Step 4 - validates subdomain format', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // Empty subdomain is valid (optional)
      expect(result.current.validateStep(4)).toBe(true);

      // Valid subdomain formats
      act(() => {
        result.current.updateBranding({ subdomain: 'acme' });
      });
      expect(result.current.validateStep(4)).toBe(true);

      act(() => {
        result.current.updateBranding({ subdomain: 'my-company-123' });
      });
      expect(result.current.validateStep(4)).toBe(true);

      // Invalid subdomain formats
      act(() => {
        result.current.updateBranding({ subdomain: '-acme' }); // Can't start with hyphen
      });
      expect(result.current.validateStep(4)).toBe(false);

      act(() => {
        result.current.updateBranding({ subdomain: 'acme-' }); // Can't end with hyphen
      });
      expect(result.current.validateStep(4)).toBe(false);

      act(() => {
        result.current.updateBranding({ subdomain: 'ACME' }); // Must be lowercase
      });
      expect(result.current.validateStep(4)).toBe(false);

      act(() => {
        result.current.updateBranding({ subdomain: 'ac' }); // Too short (min 3)
      });
      expect(result.current.validateStep(4)).toBe(false);
    });
  });

  describe('submitRequest', () => {
    it('should transform and submit request successfully', async () => {
      const mockAccessRequest = {
        id: 'request-123',
        agencyId: 'agency-123',
        clientId: 'client-123',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        authModel: 'client_authorization' as const,
        platforms: [
          {
            platformGroup: 'google',
            products: [
              { product: 'google_ads', accessLevel: 'admin' as AccessLevel, accounts: [] },
              { product: 'ga4', accessLevel: 'admin' as AccessLevel, accounts: [] },
            ],
          },
        ],
        status: 'pending' as const,
        uniqueToken: 'abc-def-ghi',
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(accessRequestsApi.createAccessRequest).mockResolvedValue({
        data: mockAccessRequest,
      });

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // Set up complete valid state
      act(() => {
        result.current.updateClient({
          id: 'client-123',
          name: 'Test Client',
          email: 'test@example.com',
          agencyId: 'agency-123',
        });
        result.current.updatePlatforms({
          google: ['google_ads', 'ga4'],
        });
        result.current.updateAccessLevel('admin');
      });

      // Submit
      await act(async () => {
        await result.current.submitRequest();
      });

      // Should have called API with correct payload
      expect(accessRequestsApi.createAccessRequest).toHaveBeenCalledWith({
        agencyId: 'agency-123',
        clientId: 'client-123',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        authModel: 'client_authorization',
        platforms: [
          {
            platformGroup: 'google',
            products: [
              { product: 'google_ads', accessLevel: 'admin', accounts: [] },
              { product: 'ga4', accessLevel: 'admin', accounts: [] },
            ],
          },
        ],
        intakeFields: [
          {
            id: '1',
            label: 'Company Website',
            type: 'url',
            required: true,
            order: 0,
          },
        ],
        branding: {
          logoUrl: '',
          primaryColor: '#6366f1',
          subdomain: '',
        },
      });

      // Should navigate to success page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/access-requests/request-123/success');
      });

      // Should not have error
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.submitting).toBe(false);
    });

    it('should handle API errors', async () => {
      vi.mocked(accessRequestsApi.createAccessRequest).mockResolvedValue({
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to create access request',
        },
      });

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // Set up valid state
      act(() => {
        result.current.updateClient({
          id: 'client-123',
          name: 'Test Client',
          email: 'test@example.com',
          agencyId: 'agency-123',
        });
        result.current.updatePlatforms({ google: ['google_ads'] });
        result.current.updateAccessLevel('admin');
      });

      // Submit
      await act(async () => {
        await result.current.submitRequest();
      });

      // Should set error state
      expect(result.current.state.error).toBe('Failed to create access request');
      expect(result.current.state.submitting).toBe(false);

      // Should NOT navigate
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should include intake fields and branding in submission', async () => {
      vi.mocked(accessRequestsApi.createAccessRequest).mockResolvedValue({
        data: {
          id: 'request-123',
        } as any,
      });

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // Set up complete state with intake and branding
      act(() => {
        result.current.updateClient({
          id: 'client-123',
          name: 'Test Client',
          email: 'test@example.com',
          agencyId: 'agency-123',
        });
        result.current.updatePlatforms({ google: ['google_ads'] });
        result.current.updateAccessLevel('admin');
        result.current.updateIntakeFields([
          { label: 'Budget', required: true },
        ]);
        result.current.updateBranding({
          logoUrl: 'https://example.com/logo.png',
          primaryColor: '#FF0000',
          subdomain: 'acme',
        });
      });

      // Submit
      await act(async () => {
        await result.current.submitRequest();
      });

      // Should include all fields
      expect(accessRequestsApi.createAccessRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          intakeFields: [{ label: 'Budget', required: true }],
          branding: {
            logoUrl: 'https://example.com/logo.png',
            primaryColor: '#FF0000',
            subdomain: 'acme',
          },
        })
      );
    });

    it('should set submitting state during API call', async () => {
      let resolveApi: any;
      const apiPromise = new Promise((resolve) => {
        resolveApi = resolve;
      });
      vi.mocked(accessRequestsApi.createAccessRequest).mockReturnValue(apiPromise as any);

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // Set up valid state
      act(() => {
        result.current.updateClient({
          id: 'client-123',
          name: 'Test Client',
          email: 'test@example.com',
          agencyId: 'agency-123',
        });
        result.current.updatePlatforms({ google: ['google_ads'] });
        result.current.updateAccessLevel('admin');
      });

      // Start submission (don't await)
      act(() => {
        result.current.submitRequest();
      });

      // Should be submitting
      await waitFor(() => {
        expect(result.current.state.submitting).toBe(true);
      });

      // Resolve API
      act(() => {
        resolveApi({ data: { id: 'request-123' } });
      });

      // Should finish submitting
      await waitFor(() => {
        expect(result.current.state.submitting).toBe(false);
      });
    });
  });

  describe('resetForm', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // Set up modified state
      act(() => {
        result.current.updateClient({
          id: 'client-123',
          name: 'Test Client',
          email: 'test@example.com',
          agencyId: 'agency-123',
        });
        result.current.updatePlatforms({ google: ['google_ads'] });
        result.current.updateAccessLevel('admin');
        result.current.setStep(3);
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      // Should be back to initial state
      expect(result.current.state).toEqual({
        client: null,
        selectedPlatforms: {},
        globalAccessLevel: null,
        intakeFields: [
          {
            id: '1',
            label: 'Company Website',
            type: 'url',
            required: true,
            order: 0,
          },
        ],
        branding: {
          logoUrl: '',
          primaryColor: '#6366f1',
          subdomain: '',
        },
        currentStep: 1,
        submitting: false,
        error: null,
      });
    });
  });

  describe('platform count calculations', () => {
    it('should calculate platform count correctly', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      act(() => {
        result.current.updatePlatforms({
          google: ['google_ads', 'ga4', 'google_tag_manager'],
          meta: ['meta_ads', 'instagram'],
          linkedin: ['linkedin_ads'],
        });
      });

      // Should be 6 total products
      const platformCount = Object.values(result.current.state.selectedPlatforms)
        .reduce((sum, products) => sum + products.length, 0);

      expect(platformCount).toBe(6);
    });

    it('should calculate group count correctly', () => {
      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      act(() => {
        result.current.updatePlatforms({
          google: ['google_ads'],
          meta: ['meta_ads'],
          linkedin: ['linkedin_ads'],
        });
      });

      // Should be 3 groups
      const groupCount = Object.entries(result.current.state.selectedPlatforms)
        .filter(([_, products]) => products.length > 0)
        .length;

      expect(groupCount).toBe(3);
    });
  });
});
