'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Network,
  Heart,
  Users,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, isLoaded, orgId } = useAuth();
  const [open, setOpen] = useState(false);

  // Development bypass for testing
  const isDevelopmentBypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

  // Redirect unauthenticated users (skip in bypass mode)
  if (!isDevelopmentBypass && isLoaded && !userId) {
    redirect('/');
  }

  // Show loading state while auth loads (skip in bypass mode)
  if (!isDevelopmentBypass && !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Connections',
      href: '/connections',
      icon: (
        <Network className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Token Health',
      href: '/token-health',
      icon: (
        <Heart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Clients',
      href: '/clients',
      icon: (
        <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden',
        'h-screen'
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <motion.span
                animate={{
                  display: open ? 'inline-block' : 'none',
                  opacity: open ? 1 : 0,
                }}
                className="font-semibold text-neutral-700 dark:text-neutral-200 whitespace-nowrap"
              >
                Agency Platform
              </motion.span>
            </div>

            {/* Navigation Links */}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* User Profile at Bottom */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <div className="flex items-center gap-2">
              <UserButton afterSignOutUrl="/" />
              <motion.div
                animate={{
                  display: open ? 'inline-block' : 'none',
                  opacity: open ? 1 : 0,
                }}
                className="text-sm text-neutral-700 dark:text-neutral-200"
              >
                Profile
              </motion.div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-auto bg-white dark:bg-neutral-900">
        {children}
      </div>
    </div>
  );
}
