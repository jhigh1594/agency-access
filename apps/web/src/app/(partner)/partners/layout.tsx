'use client';

import { AppProviders } from '../../app-providers';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProviders>{children}</AppProviders>;
}
