'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { redirect, usePathname, useRouter } from 'next/navigation';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  LayoutDashboard,
  Network,
  // Heart, // TODO: Re-enable when Token Health page is restored
  Users,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { m } from 'framer-motion';
import { useAuthOrBypass, getDevBypassAgencyData, DEV_USER_ID } from '@/lib/dev-auth';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkAuth = useAuth();
  const { userId, isLoaded, orgId, isDevelopmentBypass } = useAuthOrBypass(clerkAuth);
  const [open, setOpen] = useState(true);
  const [checkingAgency, setCheckingAgency] = useState(true);
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
        setCheckingAgency(false);
        return;
      }

      // In bypass mode, skip agency check (we have a mock agency)
      if (isDevelopmentBypass) {
        setCheckingAgency(false);
        return;
      }

      if (!isLoaded || !userId) {
        setCheckingAgency(false);
        return;
      }

      try {
        // Check if user has an agency by clerkUserId
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/agencies?clerkUserId=${encodeURIComponent(userId)}`
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
        setCheckingAgency(false);
      }
    };

    checkAgencyAndRedirect();
  }, [userId, isLoaded, pathname, isDevelopmentBypass, router]);

  // Show loading state while auth loads or while checking agency (skip in bypass mode)
  if (!isDevelopmentBypass && (!isLoaded || checkingAgency)) {
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
        <LayoutDashboard className="text-foreground h-6 w-6 flex-shrink-0" />
      ),
    },
    {
      label: 'Connections',
      href: '/connections',
      icon: (
        <Network className="text-foreground h-6 w-6 flex-shrink-0" />
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
        <Users className="text-foreground h-6 w-6 flex-shrink-0" />
      ),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <Settings className="text-foreground h-6 w-6 flex-shrink-0" />
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
              <m.div 
                className="flex items-center justify-center flex-shrink-0"
                animate={{
                  width: open ? "2rem" : "1.25rem",
                  height: open ? "2rem" : "1.25rem",
                }}
                transition={{ duration: 0.2 }}
              >
                <img 
                  src="/authhub.png" 
                  alt="AuthHub" 
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </m.div>
              <m.span
                animate={{
                  display: open ? 'inline-block' : 'none',
                  opacity: open ? 1 : 0,
                  width: open ? 'auto' : 0,
                }}
                className="font-semibold text-xl text-foreground whitespace-nowrap overflow-hidden"
              >
                AuthHub
              </m.span>
            </div>

            {/* Navigation Links */}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* User Profile at Bottom */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2">
              {isDevelopmentBypass ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    D
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-amber-900">Dev Mode</span>
                    <span className="text-xs text-amber-700">{DEV_USER_ID.slice(0, 12)}...</span>
                  </div>
                </div>
              ) : (
                <>
                  <UserButton afterSignOutUrl="/" />
                  <m.div
                    animate={{
                      display: open ? 'inline-block' : 'none',
                      opacity: open ? 1 : 0,
                    }}
                    className="text-sm text-foreground"
                  >
                    Profile
                  </m.div>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-auto bg-background">
        {children}
      </div>
    </div>
  );
}
