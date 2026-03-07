import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HelpScoutBeacon } from '../help-scout-beacon';

declare global {
  interface Window {
    Beacon?: BeaconStub;
    __helpScoutBeaconInitialized?: boolean;
  }
}

type BeaconStub = {
  (method: string, options?: unknown, data?: unknown): void;
  readyQueue?: Array<{
    method: string;
    options?: unknown;
    data?: unknown;
  }>;
};

const loadHelpScoutIdentityMock = vi.fn();
const getTokenMock = vi.fn();
const useAuthOrBypassMock = vi.fn();

vi.mock('@/lib/api/help-scout', () => ({
  loadHelpScoutIdentity: (...args: unknown[]) => loadHelpScoutIdentityMock(...args),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: getTokenMock,
    userId: 'user_123',
    orgId: null,
    isLoaded: true,
  }),
}));

vi.mock('@/lib/dev-auth', () => ({
  useAuthOrBypass: (...args: unknown[]) => useAuthOrBypassMock(...args),
}));

describe('HelpScoutBeacon', () => {
  beforeEach(() => {
    delete window.Beacon;
    delete window.__helpScoutBeaconInitialized;
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    loadHelpScoutIdentityMock.mockReset();
    getTokenMock.mockReset();
    useAuthOrBypassMock.mockReset();
    getTokenMock.mockResolvedValue('token-123');
    useAuthOrBypassMock.mockReturnValue({
      userId: 'user_123',
      orgId: null,
      isLoaded: true,
      isDevelopmentBypass: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the Beacon script and queues initialization once', async () => {
    loadHelpScoutIdentityMock.mockResolvedValue({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      signature: 'signed-value',
    });

    render(<HelpScoutBeacon />);

    await waitFor(() => {
      const script = document.querySelector<HTMLScriptElement>('script[data-helpscout-beacon="true"]');
      expect(script).not.toBeNull();
      expect(script?.src).toBe('https://beacon-v2.helpscout.net/');
    });

    expect(window.__helpScoutBeaconInitialized).toBe(true);
    expect(window.Beacon).toBeTypeOf('function');
    await waitFor(() => {
      expect(loadHelpScoutIdentityMock).toHaveBeenCalledWith({
        getToken: getTokenMock,
      });
      expect(window.Beacon?.readyQueue).toEqual([
        {
          method: 'init',
          options: '87caa405-9bd1-440e-9494-37567479c6ee',
          data: undefined,
        },
        {
          method: 'identify',
          options: {
            name: 'Alex Johnson',
            email: 'alex@example.com',
            signature: 'signed-value',
          },
          data: undefined,
        },
      ]);
    });
  });

  it('does not inject or initialize Beacon again after the first mount', () => {
    const beaconSpy = vi.fn() as BeaconStub;
    beaconSpy.readyQueue = [];
    window.Beacon = beaconSpy;
    window.__helpScoutBeaconInitialized = true;
    useAuthOrBypassMock.mockReturnValue({
      userId: null,
      orgId: null,
      isLoaded: true,
      isDevelopmentBypass: false,
    });

    const { unmount } = render(<HelpScoutBeacon />);
    unmount();
    render(<HelpScoutBeacon />);

    expect(document.querySelectorAll('script[data-helpscout-beacon="true"]')).toHaveLength(0);
    expect(beaconSpy).not.toHaveBeenCalledWith('init', '87caa405-9bd1-440e-9494-37567479c6ee');
  });

  it('logs out the Beacon identity when the component unmounts', async () => {
    const beaconSpy = vi.fn() as BeaconStub;
    beaconSpy.readyQueue = [];
    window.Beacon = beaconSpy;
    loadHelpScoutIdentityMock.mockResolvedValue({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      signature: 'signed-value',
    });

    const { unmount } = render(<HelpScoutBeacon />);

    await waitFor(() => {
      expect(beaconSpy).toHaveBeenCalledWith('init', '87caa405-9bd1-440e-9494-37567479c6ee');
      expect(beaconSpy).toHaveBeenCalledWith('identify', {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        signature: 'signed-value',
      });
    });

    unmount();

    expect(beaconSpy).toHaveBeenCalledWith('logout');
  });
});
