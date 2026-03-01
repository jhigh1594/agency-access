'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { redirect, usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  LayoutDashboard,
  Network,
  // Heart, // TODO: Re-enable when Token Health page is restored
  Users,
  Settings,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useAuthOrBypass, signOutDevBypass } from '@/lib/dev-auth';
import { readPerfHarnessContext, startPerfTimer } from '@/lib/perf-harness';
import { TrialBanner } from '@/components/trial-banner';
import { useSubscription } from '@/lib/query/billing';
import { SUBSCRIPTION_TIER_NAMES } from '@agency-platform/shared';

const agencyCheckDedup = new Set<string>();

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkAuth = useAuth();
  const { userId, isLoaded, orgId, isDevelopmentBypass } = useAuthOrBypass(clerkAuth);
  const perfHarness = useMemo(() => readPerfHarnessContext(), []);
  const runPerfAgencyCheck = isDevelopmentBypass && !!perfHarness?.token;
  const [open, setOpen] = useState(true);
  const { data: subscription } = useSubscription();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect unauthenticated users (skip in bypass mode)
  if (!isDevelopmentBypass && isLoaded && !userId) {
    redirect('/');
  }

  // Check if user has an agency and redirect to onboarding if needed
  useEffect(() => {
    const checkAgencyAndRedirect = async () => {
      // Skip if already on onboarding page
      if (pathname?.startsWith('/onboarding')) {
        return;
      }

      // Dashboard already handles missing agency state. Skip preflight check
      // to avoid an extra blocking network round-trip on sign-in.
      if (pathname === '/dashboard') {
        return;
      }

      // In bypass mode, skip agency check (we have a mock agency)
      if (isDevelopmentBypass && !runPerfAgencyCheck) {
        return;
      }

      if (!isLoaded || !userId) {
        return;
      }

      let stopTimer: (() => void) | null = null;
      try {
        stopTimer = startPerfTimer('layout:agency-check');

        const principalClerkId = (runPerfAgencyCheck ? perfHarness?.principalId : null) || orgId || userId;
        const token = await clerkAuth.getToken() || perfHarness?.token;
        if (!token || !principalClerkId || !pathname) {
          return;
        }

        const checkKey = `${principalClerkId}:${pathname}`;
        if (agencyCheckDedup.has(checkKey)) {
          return;
        }
        agencyCheckDedup.add(checkKey);

        // Check if user has an agency by clerkUserId
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/agencies?clerkUserId=${encodeURIComponent(principalClerkId)}&fields=id,name,email,clerkUserId`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch agencies:', response.status, errorText);
          // On error, don't block the user - let them through
          return;
        }
        
        const result = await response.json();
        
        // Check for API-level errors
        if (result.error) {
          console.error('API error fetching agencies:', result.error);
          // On error, don't block the user - let them through
          return;
        }
        
        // If no agency found, redirect to unified onboarding
        if (!result.data || result.data.length === 0) {
          router.replace('/onboarding/unified');
          return;
        }
      } catch (err) {
        console.error('Failed to check agency for redirect:', err);
        // On error, don't block the user - let them through
      } finally {
        stopTimer?.();
      }
    };

    checkAgencyAndRedirect();
  }, [userId, orgId, isLoaded, pathname, isDevelopmentBypass, router, clerkAuth, runPerfAgencyCheck, perfHarness]);

  // Show loading state while auth loads.
  // Agency checks run in the background to avoid blocking initial route render.
  if (!isDevelopmentBypass && !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <LayoutDashboard className="h-6 w-6 flex-shrink-0" />
      ),
    },
    {
      label: 'Connections',
      href: '/connections',
      icon: (
        <Network className="h-6 w-6 flex-shrink-0" />
      ),
    },
    // TODO: Token Health page commented out until future state is determined
    // {
    //   label: 'Token Health',
    //   href: '/token-health',
    //   icon: (
    //     <Heart className="text-foreground h-6 w-6 flex-shrink-0" />
    //   ),
    // },
    {
      label: 'Clients',
      href: '/clients',
      icon: (
        <Users className="h-6 w-6 flex-shrink-0" />
      ),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <Settings className="h-6 w-6 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row bg-muted w-full flex-1 mx-auto border border-border overflow-hidden',
        'h-screen'
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className={cn(
              "flex items-center gap-3 mb-8 overflow-hidden min-h-[2rem]",
              open ? "justify-center md:justify-start" : "justify-center"
            )}>
              <div
                className={cn(
                  'relative h-8 w-8 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none',
                  open ? 'scale-100' : 'scale-75'
                )}
              >
                <Image
                  src="/authhub.png"
                  alt="AuthHub"
                  fill
                  sizes="32px"
                  className="object-contain"
                  priority
                />
              </div>
              <span
                aria-hidden={!open}
                className={cn(
                  'inline-block origin-left overflow-hidden whitespace-nowrap text-xl font-semibold text-paper transition-all duration-200 motion-reduce:transition-none',
                  open ? 'scale-x-100 opacity-100' : 'pointer-events-none scale-x-0 opacity-0'
                )}
              >
                AuthHub
              </span>
            </div>

            {/* Navigation Links */}
            <nav aria-label="Primary navigation" className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </nav>
          </div>

          {/* User Profile at Bottom */}
          <div className="border-t border-paper/20 pt-4">
            <div className="flex items-center gap-2">
              {isDevelopmentBypass ? (
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-2 py-1.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-warning text-paper text-xs font-bold" aria-hidden>
                    D
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-medium text-warning">Dev Mode</span>
                    <button
                      type="button"
                      onClick={() => {
                        signOutDevBypass();
                        router.push('/');
                      }}
                      className="text-left text-xs text-warning/90 hover:text-warning hover:underline"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <UserButton afterSignOutUrl="/" />
                  <span
                    aria-hidden={!open}
                    className={cn(
                      'inline-block origin-left text-sm text-paper transition-all duration-200 motion-reduce:transition-none',
                      open ? 'scale-x-100 opacity-100' : 'pointer-events-none scale-x-0 opacity-0'
                    )}
                  >
                    Profile
                  </span>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-auto bg-background">
        {subscription?.status === 'trialing' && subscription.trialEnd && (
          <TrialBanner
            trialEnd={subscription.trialEnd}
            tierName={subscription.tier ? SUBSCRIPTION_TIER_NAMES[subscription.tier] : 'your'}
          />
        )}
        {children}
      </div>
    </div>
  );
}
