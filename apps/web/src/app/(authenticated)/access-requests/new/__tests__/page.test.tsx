/**
 * Access Request Wizard Integration Tests
 *
 * Phase 5: End-to-end tests for the complete wizard flow
 * including step navigation, validation, and API submission.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import AccessRequestPage from '../page';
import * as accessRequestsApi from '@/lib/api/access-requests';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  useAuth: vi.fn(),
}));

// Mock API client
vi.mock('@/lib/api/access-requests', () => ({
  createAccessRequest: vi.fn(),
}));

// Mock child components (they have their own tests)
vi.mock('@/components/client-selector', () => {
  const ClientSelector = ({ onSelect, value }: any) => (
    <div data-testid="client-selector">
      <button
        onClick={() =>
          onSelect({
            id: 'client-123',
            name: 'Test Client',
            email: 'test@example.com',
            agencyId: 'agency-123',
          })
        }
      >
        Select Client
      </button>
      {value && <div data-testid="selected-client">{value}</div>}
    </div>
  );
  return { ClientSelector };
});

vi.mock('@/components/access-level-selector', () => {
  const AccessLevelSelector = ({ onSelectionChange, selectedAccessLevel }: any) => (
    <div data-testid="access-level-selector">
      <button onClick={() => onSelectionChange('admin')}>Select Admin</button>
      <button onClick={() => onSelectionChange('standard')}>Select Standard</button>
      {selectedAccessLevel && (
        <div data-testid="selected-access-level">{selectedAccessLevel}</div>
      )}
    </div>
  );
  return { AccessLevelSelector };
});

vi.mock('@/components/hierarchical-platform-selector', () => {
  const HierarchicalPlatformSelector = ({ onSelectionChange, selectedPlatforms }: any) => (
    <div data-testid="platform-selector">
      <button
        onClick={() =>
          onSelectionChange({
            google: ['google_ads', 'ga4'],
            meta: ['meta_ads'],
          })
        }
      >
        Select Platforms
      </button>
      {Object.keys(selectedPlatforms || {}).length > 0 && (
        <div data-testid="selected-platforms">
          {JSON.stringify(selectedPlatforms)}
        </div>
      )}
    </div>
  );
  return { HierarchicalPlatformSelector };
});

describe('AccessRequestPage - Full Wizard Flow', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useUser).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: 'user-123',
        emailAddresses: [{ emailAddress: 'agency@example.com' }],
      },
    } as any);
    vi.mocked(useAuth).mockReturnValue({
      userId: 'user-123',
      isLoaded: true,
      isSignedIn: true,
    } as any);
  });

  it('should render Step 1 initially', () => {
    render(<AccessRequestPage />);

    expect(screen.getByText('Select Client')).toBeInTheDocument();
    expect(screen.getByText('Client Info')).toBeInTheDocument();
    expect(screen.getByTestId('client-selector')).toBeInTheDocument();
  });

  it('should disable Continue button when no client is selected', () => {
    render(<AccessRequestPage />);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('should enable Continue button when client is selected', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    const selectClientButton = screen.getByText('Select Client');
    await user.click(selectClientButton);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toBeDisabled();
  });

  it('should navigate to Step 2 when Continue is clicked', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    // Select client
    const selectClientButton = screen.getByText('Select Client');
    await user.click(selectClientButton);

    // Click continue
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);

    // Should now be on Step 2
    await waitFor(() => {
      expect(screen.getByText('Platforms')).toBeInTheDocument();
    });
  });

  it('should require access level and platforms in Step 2', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    // Navigate to Step 2
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId('access-level-selector')).toBeInTheDocument();
    });

    // Continue should be disabled
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('should enable Continue in Step 2 when access level and platforms are selected', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    // Navigate to Step 2
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId('access-level-selector')).toBeInTheDocument();
    });

    // Select access level using within() to scope to the component
    const accessLevelSelector = screen.getByTestId('access-level-selector');
    await user.click(within(accessLevelSelector).getByText('Select Admin'));

    // Select platforms using within() to scope to the component
    const platformSelector = screen.getByTestId('platform-selector');
    await user.click(within(platformSelector).getByText('Select Platforms'));

    // Continue should now be enabled
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
  });

  it('should show platform count when platforms are selected', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    // Navigate to Step 2
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId('platform-selector')).toBeInTheDocument();
    });

    // Select platforms (google: 2, meta: 1 = 3 total)
    const platformSelector = screen.getByTestId('platform-selector');
    await user.click(within(platformSelector).getByText('Select Platforms'));

    await waitFor(() => {
      expect(screen.getByText(/3 products/i)).toBeInTheDocument();
      expect(screen.getByText(/2 platforms/i)).toBeInTheDocument();
    });
  });

  it('should navigate to Step 3 (intake fields)', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    // Navigate through Steps 1 and 2
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId('access-level-selector')).toBeInTheDocument();
    });

    const accessLevelSelector = screen.getByTestId('access-level-selector');
    await user.click(within(accessLevelSelector).getByText('Select Admin'));

    const platformSelector = screen.getByTestId('platform-selector');
    await user.click(within(platformSelector).getByText('Select Platforms'));

    await waitFor(() => {
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Should now be on Step 3
    await waitFor(() => {
      expect(screen.getByText('Form Fields')).toBeInTheDocument();
    });
  });

  it('should navigate to Step 4 (branding)', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    // Navigate through Steps 1, 2, and 3
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByTestId('access-level-selector'));
    const accessLevelSelector = screen.getByTestId('access-level-selector');
    await user.click(within(accessLevelSelector).getByText('Select Admin'));

    const platformSelector = screen.getByTestId('platform-selector');
    await user.click(within(platformSelector).getByText('Select Platforms'));

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText('Form Fields'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Should now be on Step 4
    await waitFor(() => {
      expect(screen.getByText('Branding')).toBeInTheDocument();
    });
  });

  it('should allow going back to previous steps', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    // Navigate to Step 2
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Wait for Step 2 to be active (check for unique Step 2 content)
    await waitFor(() => {
      expect(screen.getByText('Platforms')).toBeInTheDocument(); // Progress indicator
      expect(screen.getByText('Access Level for All Platforms')).toBeInTheDocument(); // Step 2 heading
      expect(screen.getByTestId('access-level-selector')).toBeInTheDocument(); // Step 2 component
    });

    // Click the Back button (should be in the form navigation)
    const backButton = screen.getByRole('button', { name: 'Back' });
    await user.click(backButton);

    // Should be back on Step 1 (check for Step 1 content)
    await waitFor(() => {
      expect(screen.getByText('Client Information')).toBeInTheDocument(); // Step 1 heading
      expect(screen.getByTestId('client-selector')).toBeInTheDocument();
    });
  });

  it('should preserve data when navigating between steps', async () => {
    const user = userEvent.setup();
    render(<AccessRequestPage />);

    // Select client in Step 1
    await user.click(screen.getByText('Select Client'));
    expect(screen.getByTestId('selected-client')).toHaveTextContent('client-123');

    // Navigate to Step 2
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Go back to Step 1
    await waitFor(() => screen.getByText('Platforms'));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    // Client should still be selected
    await waitFor(() => {
      expect(screen.getByTestId('selected-client')).toHaveTextContent('client-123');
    });
  });

  it('should submit access request successfully', async () => {
    const user = userEvent.setup();
    const mockAccessRequest = {
      id: 'request-123',
      agencyId: 'agency-123',
      clientId: 'client-123',
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      authModel: 'client_authorization' as const,
      platforms: [],
      status: 'pending' as const,
      uniqueToken: 'abc-def-ghi',
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(accessRequestsApi.createAccessRequest).mockResolvedValue({
      data: mockAccessRequest,
    });

    render(<AccessRequestPage />);

    // Navigate through all steps
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByTestId('access-level-selector'));
    const accessLevelSelector = screen.getByTestId('access-level-selector');
    await user.click(within(accessLevelSelector).getByText('Select Admin'));

    const platformSelector = screen.getByTestId('platform-selector');
    await user.click(within(platformSelector).getByText('Select Platforms'));

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText('Form Fields'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText('Branding'));

    // Submit the form
    const createButton = screen.getByRole('button', { name: /create access request/i });
    await user.click(createButton);

    // Should call API
    await waitFor(() => {
      expect(accessRequestsApi.createAccessRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          agencyId: 'user-123',
          clientId: 'client-123',
          clientName: 'Test Client',
          clientEmail: 'test@example.com',
          authModel: 'client_authorization',
        })
      );
    });

    // Should navigate to success page
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/access-requests/request-123/success'
      );
    });
  });

  it('should display error message when API fails', async () => {
    const user = userEvent.setup();

    vi.mocked(accessRequestsApi.createAccessRequest).mockResolvedValue({
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to create access request',
      },
    });

    render(<AccessRequestPage />);

    // Navigate through all steps and submit
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByTestId('access-level-selector'));
    const accessLevelSelector = screen.getByTestId('access-level-selector');
    await user.click(within(accessLevelSelector).getByText('Select Admin'));

    const platformSelector = screen.getByTestId('platform-selector');
    await user.click(within(platformSelector).getByText('Select Platforms'));

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText('Form Fields'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText('Branding'));

    const createButton = screen.getByRole('button', { name: /create access request/i });
    await user.click(createButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create access request/i)).toBeInTheDocument();
    });

    // Should NOT navigate
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();

    // Create a promise we can control
    let resolveApi: any;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    vi.mocked(accessRequestsApi.createAccessRequest).mockReturnValue(apiPromise as any);

    render(<AccessRequestPage />);

    // Navigate through all steps and submit
    await user.click(screen.getByText('Select Client'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByTestId('access-level-selector'));
    const accessLevelSelector = screen.getByTestId('access-level-selector');
    await user.click(within(accessLevelSelector).getByText('Select Admin'));

    const platformSelector = screen.getByTestId('platform-selector');
    await user.click(within(platformSelector).getByText('Select Platforms'));

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText('Form Fields'));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => screen.getByText('Branding'));

    const createButton = screen.getByRole('button', { name: /create access request/i });
    await user.click(createButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();
    });

    // Button should be disabled during loading
    expect(createButton).toBeDisabled();

    // Resolve the API call
    resolveApi({
      data: {
        id: 'request-123',
        agencyId: 'agency-123',
        clientId: 'client-123',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        authModel: 'client_authorization',
        platforms: [],
        status: 'pending',
        uniqueToken: 'abc-def-ghi',
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    // Loading should go away
    await waitFor(() => {
      expect(screen.queryByText(/creating\.\.\./i)).not.toBeInTheDocument();
    });
  });
});
