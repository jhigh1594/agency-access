import ReactDOM from 'react-dom/client';
import { ClientDetailHarness } from '@/components/client-detail/ClientDetailHarness';
import '@/app/globals.css';

const searchParams = new URLSearchParams(window.location.search);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClientDetailHarness
    searchParams={{
      preset: searchParams.get('preset') ?? undefined,
      expand: searchParams.get('expand') ?? undefined,
    }}
  />
);
