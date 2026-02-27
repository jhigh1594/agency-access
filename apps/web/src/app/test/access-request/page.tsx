/**
 * Visual Test Page for Access Request Flow
 *
 * This page shows the access request flow with mock data for visual testing.
 * Only available in development mode.
 *
 * Routes:
 * - /test/access-request?step=1 - Connect step
 * - /test/access-request?step=2 - Choose accounts step
 * - /test/access-request?step=3 - Complete step
 */

import { Suspense } from 'react';
import { AccessRequestTestContent } from './AccessRequestTestContent';

export default function AccessRequestTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AccessRequestTestContent />
    </Suspense>
  );
}
