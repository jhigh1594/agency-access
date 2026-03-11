'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useAuthOrBypass } from '@/lib/dev-auth';
import { loadHelpScoutIdentity } from '@/lib/api/help-scout';

const HELPSCOUT_BEACON_ID = '87caa405-9bd1-440e-9494-37567479c6ee';
const HELPSCOUT_SCRIPT_SRC = 'https://beacon-v2.helpscout.net';
const HELPSCOUT_SCRIPT_SELECTOR = 'script[data-helpscout-beacon="true"]';

type BeaconCall = {
  method: string;
  options?: unknown;
  data?: unknown;
};

type BeaconFunction = {
  (method: string, options?: unknown, data?: unknown): void;
  readyQueue?: BeaconCall[];
};

declare global {
  interface Window {
    Beacon?: BeaconFunction;
    __helpScoutBeaconInitialized?: boolean;
  }
}

function createBeaconStub(existingBeacon?: BeaconFunction): BeaconFunction {
  if (existingBeacon) {
    return existingBeacon;
  }

  const beaconStub: BeaconFunction = (method, options, data) => {
    beaconStub.readyQueue?.push({ method, options, data });
  };
  beaconStub.readyQueue = [];

  return beaconStub;
}

function ensureBeaconScript() {
  if (document.querySelector(HELPSCOUT_SCRIPT_SELECTOR)) {
    return;
  }

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = HELPSCOUT_SCRIPT_SRC;
  script.dataset.helpscoutBeacon = 'true';
  document.head.appendChild(script);
}

export function HelpScoutBeacon() {
  const clerkAuth = useAuth();
  const { userId, isLoaded, isDevelopmentBypass } = useAuthOrBypass(clerkAuth);

  useEffect(() => {
    if (isDevelopmentBypass) {
      return;
    }

    if (window.__helpScoutBeaconInitialized) {
      return;
    }

    window.Beacon = createBeaconStub(window.Beacon);
    ensureBeaconScript();
    window.Beacon('init', HELPSCOUT_BEACON_ID);
    window.__helpScoutBeaconInitialized = true;
  }, [isDevelopmentBypass]);

  useEffect(() => {
    if (!isLoaded || !userId || isDevelopmentBypass) {
      return;
    }

    let cancelled = false;

    const identifyUser = async () => {
      try {
        const identity = await loadHelpScoutIdentity({
          getToken: clerkAuth.getToken,
        });

        if (cancelled) {
          return;
        }

        window.Beacon?.('identify', identity);
      } catch {
        // Keep Beacon available even when secure-mode identity lookup fails.
      }
    };

    void identifyUser();

    return () => {
      cancelled = true;
      window.Beacon?.('logout');
    };
  }, [clerkAuth, isDevelopmentBypass, isLoaded, userId]);

  return null;
}
