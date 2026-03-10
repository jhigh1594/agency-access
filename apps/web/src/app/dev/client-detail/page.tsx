import { notFound } from 'next/navigation';
import { ClientDetailHarness } from '@/components/client-detail/ClientDetailHarness';

interface ClientDetailHarnessPageProps {
  searchParams?: {
    preset?: string;
    expand?: string;
  };
}

export default function ClientDetailHarnessPage({
  searchParams,
}: ClientDetailHarnessPageProps) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ClientDetailHarness searchParams={searchParams} />;
}
