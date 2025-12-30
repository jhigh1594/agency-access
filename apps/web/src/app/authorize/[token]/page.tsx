/**
 * Route Alias: /authorize/[token] → /invite/[token]
 *
 * Provides an alternative URL path for client authorization.
 * Redirects to the existing /invite/[token] route.
 */

import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AuthorizePage({ params }: PageProps) {
  const { token } = await params;
  redirect(`/invite/${token}`);
}
