import { AppProviders } from '../app-providers';

export default function PlatformsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppProviders>{children}</AppProviders>;
}
