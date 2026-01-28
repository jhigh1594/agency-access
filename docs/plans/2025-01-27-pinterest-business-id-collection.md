# Pinterest Business ID Collection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Pinterest Business ID collection to the platform connection flow, matching Agency Access's pattern of requesting the Business ID from agency owners with instructions and deep links to Pinterest Business Manager settings.

**Architecture:** Create a Pinterest Business ID input component that:
1. Shows after successful Pinterest OAuth connection
2. Displays instructions with deep link to Pinterest Business Manager settings
3. Collects and stores the Business ID in `AgencyPlatformConnection.metadata`
4. Makes the Business ID optional (Pinterest API works without it, but it's useful for metadata and future features)

**Tech Stack:** React (Next.js 16), TypeScript, TailwindCSS, Fastify backend, Prisma ORM

---

## Task 1: Add Pinterest Business ID Types to Shared Package

**Files:**
- Modify: `packages/shared/src/types.ts`

**Step 1: Read the current types file to find the right location**

```bash
# Find the metadata interface definitions
grep -n "metadata" packages/shared/src/types.ts | head -20
```

Expected: Lines showing where metadata interfaces are defined (around line 250-450)

**Step 2: Add Pinterest metadata interface**

Find the section with other platform metadata interfaces (around line 450-500) and add:

```typescript
/**
 * Pinterest connection metadata
 * Business ID is optional - Pinterest API works without it, but it's useful for:
 * - Identifying which business the connection represents
 * - Future business-specific operations (audience sharing, partnerships)
 * - Better metadata and reporting
 */
export interface PinterestConnectionMetadata {
  businessId?: string;  // Pinterest Business ID from Business Manager
  businessName?: string; // Optional: Business name for display
}
```

**Step 3: Export the new interface**

Add to the exports section (around line 500+):

```typescript
export type PinterestConnectionMetadata = z.infer<typeof z.object({
  businessId: z.string().optional(),
  businessName: z.string().optional(),
})>;
```

**Step 4: Run typecheck**

```bash
npm run typecheck --workspace=packages/shared
```

Expected: PASS (no errors)

**Step 5: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat(types): add Pinterest connection metadata interface for Business ID"
```

---

## Task 2: Create Pinterest Business ID Input Component (Frontend)

**Files:**
- Create: `apps/web/src/components/pinterest-business-id-input.tsx`

**Step 1: Write the failing test**

Create `apps/web/src/components/__tests__/pinterest-business-id-input.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinterestBusinessIdInput } from '../pinterest-business-id-input';

describe('PinterestBusinessIdInput', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display Pinterest Business ID input form', () => {
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('Pinterest Business ID')).toBeInTheDocument();
    expect(screen.getByText(/Add your Pinterest Business ID/)).toBeInTheDocument();
    expect(screen.getByLabelText('Business ID')).toBeInTheDocument();
  });

  it('should show deep link to Pinterest Business Manager', () => {
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const link = screen.getByRole('link', { name: /Pinterest Business Manager settings/i });
    expect(link).toHaveAttribute('href', 'https://www.pinterest.com/business/business-manager/');
  });

  it('should validate Business ID format (numbers only)', async () => {
    const user = userEvent.setup();
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const input = screen.getByLabelText('Business ID');
    const submitButton = screen.getByRole('button', { name: /Continue/i });

    // Enter invalid Business ID (contains letters)
    await user.type(input, 'abc123');

    // Button should be disabled
    expect(submitButton).toBeDisabled();
  });

  it('should accept valid Business ID format', async () => {
    const user = userEvent.setup();
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const input = screen.getByLabelText('Business ID');
    const submitButton = screen.getByRole('button', { name: /Continue/i });

    // Enter valid Business ID (numbers only)
    await user.type(input, '664351519939856629');

    // Button should be enabled
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('should call onSubmit with Business ID when Continue is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const input = screen.getByLabelText('Business ID');
    const submitButton = screen.getByRole('button', { name: /Continue/i });

    await user.type(input, '664351519939856629');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('664351519939856629');
    });
  });

  it('should call onSkip when Skip is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const skipButton = screen.getByRole('button', { name: /Skip for now/i });
    await user.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('should show instructions with example Business ID', () => {
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText(/664351519939856629/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/web
npm test src/components/__tests__/pinterest-business-id-input.test.tsx
```

Expected: FAIL with "Cannot find module '../pinterest-business-id-input'"

**Step 3: Write minimal implementation**

Create `apps/web/src/components/pinterest-business-id-input.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ExternalLink, Info, ChevronRight } from 'lucide-react';

interface PinterestBusinessIdInputProps {
  agencyId: string;
  onSubmit: (businessId: string) => void;
  onSkip: () => void;
  isSaving?: boolean;
}

/**
 * Pinterest Business ID Input Component
 *
 * Collects Pinterest Business ID from agency owners (optional).
 * The Business ID is found in Pinterest Business Manager settings.
 *
 * Pinterest API works without Business ID for basic ad account access,
 * but collecting it provides:
 * - Better UX (identifying which business is connected)
 * - Future business-specific operations (audience sharing, partnerships)
 * - Improved metadata and reporting
 */
export function PinterestBusinessIdInput({
  agencyId,
  onSubmit,
  onSkip,
  isSaving = false,
}: PinterestBusinessIdInputProps) {
  const [businessId, setBusinessId] = useState('');

  // Pinterest Business IDs are numeric strings (1-20 digits)
  const isValidBusinessId = /^\d{1,20}$/.test(businessId);
  const canSubmit = isValidBusinessId && !isSaving;

  const handleSubmit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (canSubmit) {
      onSubmit(businessId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-900">Pinterest Business ID</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
              Optional
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Add your Pinterest Business ID to help identify your connection. This is optional but recommended for better organization.
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-indigo-900 font-semibold mb-1">
                Where to find your Pinterest Business ID
              </p>
              <p className="text-sm text-indigo-700 mb-2">
                1. Go to{' '}
                <a
                  href="https://www.pinterest.com/business/business-manager/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-700 font-semibold hover:underline"
                >
                  Pinterest Business Manager
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-sm text-indigo-700 mb-2">
                2. Select your business from the left sidebar
              </p>
              <p className="text-sm text-indigo-700 mb-2">
                3. Click <strong className="text-indigo-900">Settings</strong> in the top navigation
              </p>
              <p className="text-sm text-indigo-700">
                4. Your Business ID is displayed in the overview section
              </p>
              <div className="mt-3 p-2 bg-white rounded border border-indigo-200">
                <p className="text-xs text-indigo-600 font-mono">
                  Example: 664351519939856629
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
              Business ID <span className="text-slate-300">(numbers only)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g., 664351519939856629"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              maxLength={20}
            />
            {businessId && !isValidBusinessId && (
              <p className="mt-2 text-xs text-red-600 px-1">
                Business ID must contain only numbers
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              onClick={onSkip}
              disabled={isSaving}
              type="button"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              type="button"
              className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all
                ${canSubmit
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/web
npm test src/components/__tests__/pinterest-business-id-input.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/pinterest-business-id-input.tsx
git add apps/web/src/components/__tests__/pinterest-business-id-input.test.tsx
git commit -m "feat(frontend): add Pinterest Business ID input component"
```

---

## Task 3: Add Backend API Route to Save Pinterest Business ID

**Files:**
- Create: `apps/api/src/routes/agency-platforms/pinterest.routes.ts`
- Modify: `apps/api/src/routes/agency-platforms/index.ts` (to register routes)

**Step 1: Write the failing test**

Create `apps/api/src/routes/agency-platforms/__tests__/pinterest.routes.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../../app';
import { prisma } from '../../../lib/prisma';
import { infisical } from '../../../lib/infisical';

// Mock Infisical
vi.mock('../../../lib/infisical');

describe('Pinterest Agency Platform Routes', () => {
  let app: any;
  let testAgency: any;
  let testConnection: any;
  let authToken: string;

  beforeEach(async () => {
    // Create test agency and connection
    testAgency = await prisma.agency.create({
      data: {
        name: 'Test Agency',
        clerkOrganizationId: 'test-org-' + Math.random(),
      },
    });

    // Mock a Pinterest connection
    testConnection = await prisma.agencyPlatformConnection.create({
      data: {
        agencyId: testAgency.id,
        platform: 'pinterest',
        secretId: 'test-secret-id',
        status: 'active',
      },
    });

    // Mock auth token
    authToken = 'Bearer test-token';

    app = buildApp();
  });

  afterEach(async () => {
    // Cleanup
    await prisma.agencyPlatformConnection.deleteMany();
    await prisma.agency.deleteMany();
  });

  describe('PATCH /agency-platforms/pinterest/business-id', () => {
    it('should save Pinterest Business ID to connection metadata', async () => {
      const response = await request(app)
        .patch('/agency-platforms/pinterest/business-id')
        .set('Authorization', authToken)
        .send({
          agencyId: testAgency.id,
          businessId: '664351519939856629',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.metadata.businessId).toBe('664351519939856629');
    });

    it('should validate Business ID format (numbers only)', async () => {
      const response = await request(app)
        .patch('/agency-platforms/pinterest/business-id')
        .set('Authorization', authToken)
        .send({
          agencyId: testAgency.id,
          businessId: 'invalid-id-with-letters',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate Business ID length (1-20 digits)', async () => {
      const response = await request(app)
        .patch('/agency-platforms/pinterest/business-id')
        .set('Authorization', authToken)
        .send({
          agencyId: testAgency.id,
          businessId: '123456789012345678901', // 21 digits
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if connection does not exist', async () => {
      const response = await request(app)
        .patch('/agency-platforms/pinterest/business-id')
        .set('Authorization', authToken)
        .send({
          agencyId: 'non-existent-agency',
          businessId: '664351519939856629',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/api
npm test src/routes/agency-platforms/__tests__/pinterest.routes.test.ts
```

Expected: FAIL with route not found

**Step 3: Write minimal implementation**

Create `apps/api/src/routes/agency-platforms/pinterest.routes.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * Pinterest agency platform routes
 * Handles Pinterest-specific platform connection operations
 */

// Request schema for saving Business ID
const SaveBusinessIdSchema = z.object({
  agencyId: z.string().uuid(),
  businessId: z.string().regex(/^\d{1,20}$/, 'Business ID must be 1-20 digits'),
});

export async function pinterestRoutes(fastify: FastifyInstance) {
  /**
   * Save Pinterest Business ID to connection metadata
   *
   * This endpoint is called after successful Pinterest OAuth connection
   * to optionally store the Business ID for better organization and
   * future business-specific operations.
   */
  fastify.patch('/business-id', {
    schema: {
      body: SaveBusinessIdSchema,
    },
  }, async (request, reply) => {
    const { agencyId, businessId } = SaveBusinessIdSchema.parse(request.body);

    // Get existing connection
    const connection = await fastify.prisma.agencyPlatformConnection.findFirst({
      where: {
        agencyId,
        platform: 'pinterest',
      },
    });

    if (!connection) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Pinterest connection not found for this agency',
        },
      });
    }

    // Merge with existing metadata
    const existingMetadata = (connection.metadata as any) || {};
    const updatedMetadata = {
      ...existingMetadata,
      businessId,
    };

    // Update connection
    await fastify.prisma.agencyPlatformConnection.update({
      where: { id: connection.id },
      data: {
        metadata: updatedMetadata,
      },
    });

    // Log audit entry
    await fastify.prisma.auditLog.create({
      data: {
        agencyId,
        action: 'AGENCY_CONNECTED',
        platform: 'pinterest',
        metadata: {
          businessId,
          connectionId: connection.id,
        },
      },
    });

    return reply.send({
      data: {
        id: connection.id,
        platform: 'pinterest',
        metadata: updatedMetadata,
      },
    });
  });
}
```

**Step 4: Register the Pinterest routes**

Modify `apps/api/src/routes/agency-platforms/index.ts`:

```typescript
import { fastify } from '../../../lib/fastify';
import { metaRoutes } from './meta.routes';
import { pinterestRoutes } from './pinterest.routes'; // Add this import

// Register existing routes
fastify.register(metaRoutes, { prefix: '/agency-platforms/meta' });
fastify.register(pinterestRoutes, { prefix: '/agency-platforms/pinterest' }); // Add this
```

**Step 5: Run test to verify it passes**

```bash
cd apps/api
npm test src/routes/agency-platforms/__tests__/pinterest.routes.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/src/routes/agency-platforms/pinterest.routes.ts
git add apps/api/src/routes/agency-platforms/index.ts
git add apps/api/src/routes/agency-platforms/__tests__/pinterest.routes.test.ts
git commit -m "feat(backend): add Pinterest Business ID API endpoint"
```

---

## Task 4: Integrate Business ID Input into Connection Flow

**Files:**
- Modify: `apps/web/src/components/platform-connection-modal.tsx` (or equivalent connection flow component)
- Create: `apps/web/src/components/pinterest-connection-flow.tsx` (new orchestration component)

**Step 1: Find the connection flow component**

```bash
# Find where OAuth connections are handled
find apps/web/src -name "*.tsx" -type f | xargs grep -l "OAuth\|connection.*flow" | head -10
```

Expected: Component files that handle platform connections

**Step 2: Write the failing test**

Create `apps/web/src/components/__tests__/pinterest-connection-flow.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PinterestConnectionFlow } from '../pinterest-connection-flow';

describe('PinterestConnectionFlow', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show Business ID input after successful OAuth', async () => {
    render(
      <PinterestConnectionFlow
        agencyId="test-agency"
        connectionStatus="success"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Pinterest Business ID')).toBeInTheDocument();
    });
  });

  it('should call API to save Business ID and then onSuccess', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { metadata: { businessId: '123456' } } }),
      } as Response)
    );

    render(
      <PinterestConnectionFlow
        agencyId="test-agency"
        connectionStatus="success"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    const input = await screen.findByLabelText('Business ID');
    const continueButton = screen.getByRole('button', { name: /Continue/i });

    await user.type(input, '123456');
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should skip Business ID and call onSuccess when Skip is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PinterestConnectionFlow
        agencyId="test-agency"
        connectionStatus="success"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper }
    );

    const skipButton = await screen.findByRole('button', { name: /Skip for now/i });
    await user.click(skipButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
```

**Step 3: Run test to verify it fails**

```bash
cd apps/web
npm test src/components/__tests__/pinterest-connection-flow.test.tsx
```

Expected: FAIL with component not found

**Step 4: Write minimal implementation**

Create `apps/web/src/components/pinterest-connection-flow.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PinterestBusinessIdInput } from './pinterest-business-id-input';

interface PinterestConnectionFlowProps {
  agencyId: string;
  connectionStatus: 'pending' | 'success' | 'error';
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Pinterest Connection Flow Orchestrator
 *
 * Manages the multi-step Pinterest connection process:
 * 1. OAuth connection (handled elsewhere)
 * 2. Business ID collection (optional)
 */
export function PinterestConnectionFlow({
  agencyId,
  connectionStatus,
  onSuccess,
  onCancel,
}: PinterestConnectionFlowProps) {
  const [step, setStep] = useState<'business-id' | 'complete'>('business-id');

  // Mutation to save Business ID
  const saveBusinessId = useMutation({
    mutationFn: async (businessId: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agency-platforms/pinterest/business-id`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agencyId, businessId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to save Business ID');
      }

      return response.json();
    },
    onSuccess: () => {
      setStep('complete');
      onSuccess();
    },
  });

  const handleSubmit = (businessId: string) => {
    saveBusinessId.mutate(businessId);
  };

  const handleSkip = () => {
    setStep('complete');
    onSuccess();
  };

  if (connectionStatus !== 'success') {
    return null; // Let parent handle OAuth pending/error states
  }

  if (step === 'complete') {
    return null; // Parent will show success state
  }

  return (
    <PinterestBusinessIdInput
      agencyId={agencyId}
      onSubmit={handleSubmit}
      onSkip={handleSkip}
      isSaving={saveBusinessId.isPending}
    />
  );
}
```

**Step 5: Run test to verify it passes**

```bash
cd apps/web
npm test src/components/__tests__/pinterest-connection-flow.test.tsx
```

Expected: PASS

**Step 6: Commit**

```bash
git add apps/web/src/components/pinterest-connection-flow.tsx
git add apps/web/src/components/__tests__/pinterest-connection-flow.test.tsx
git commit -m "feat(frontend): integrate Pinterest Business ID into connection flow"
```

---

## Task 5: Add Pinterest Business ID Display to Settings

**Files:**
- Create: `apps/web/src/components/pinterest-business-settings.tsx`

**Step 1: Write the failing test**

Create `apps/web/src/components/__tests__/pinterest-business-settings.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PinterestBusinessSettings } from '../pinterest-business-settings';

describe('PinterestBusinessSettings', () => {
  it('should display Business ID when present', () => {
    render(
      <PinterestBusinessSettings
        agencyId="test-agency"
        businessId="664351519939856629"
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('664351519939856629')).toBeInTheDocument();
    expect(screen.getByText(/Your Pinterest Business ID/)).toBeInTheDocument();
  });

  it('should show add button when no Business ID', () => {
    render(
      <PinterestBusinessSettings
        agencyId="test-agency"
        businessId={undefined}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText(/Add Business ID/)).toBeInTheDocument();
  });

  it('should show deep link to Pinterest Business Manager', () => {
    render(
      <PinterestBusinessSettings
        agencyId="test-agency"
        businessId="664351519939856629"
        onUpdate={vi.fn()}
      />
    );

    const link = screen.getByRole('link', { name: /View in Pinterest Business Manager/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('pinterest.com'));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/web
npm test src/components/__tests__/pinterest-business-settings.test.tsx
```

Expected: FAIL with component not found

**Step 3: Write minimal implementation**

Create `apps/web/src/components/pinterest-business-settings.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { ExternalLink, Edit2, Plus, Check } from 'lucide-react';

interface PinterestBusinessSettingsProps {
  agencyId: string;
  businessId?: string;
  onUpdate: (businessId: string) => Promise<void>;
}

/**
 * Pinterest Business Settings Component
 *
 * Displays the current Pinterest Business ID and allows editing.
 * Shows in the agency's platform connection settings.
 */
export function PinterestBusinessSettings({
  agencyId,
  businessId,
  onUpdate,
}: PinterestBusinessSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(businessId || '');
  const [isSaving, setIsSaving] = useState(false);

  const isValidBusinessId = /^\d{1,20}$/.test(value);

  const handleSave = async () => {
    if (!isValidBusinessId) return;

    setIsSaving(true);
    try {
      await onUpdate(value);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update Business ID:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          Pinterest Business ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter Business ID"
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            maxLength={20}
            disabled={isSaving}
          />
          <button
            onClick={handleSave}
            disabled={!isValidBusinessId || isSaving}
            className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : <><Check className="h-4 w-4" /> Save</>}
          </button>
          <button
            onClick={() => {
              setValue(businessId || '');
              setIsEditing(false);
            }}
            disabled={isSaving}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Pinterest Business ID
          </label>
          {businessId ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono text-slate-900">{businessId}</p>
              <a
                href={`https://www.pinterest.com/business/business-manager/${businessId}/settings/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View in Business Manager
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No Business ID set</p>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
        >
          {businessId ? (
            <>
              <Edit2 className="h-4 w-4" /> Edit
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Add
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/web
npm test src/components/__tests__/pinterest-business-settings.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/pinterest-business-settings.tsx
git add apps/web/src/components/__tests__/pinterest-business-settings.test.tsx
git commit -m "feat(frontend): add Pinterest Business ID settings display component"
```

---

## Task 6: Update Environment Variables Documentation

**Files:**
- Modify: `apps/api/.env.example`

**Step 1: Add Pinterest environment variables**

Find the platform credentials section and add:

```bash
# Pinterest OAuth
PINTEREST_CLIENT_ID=your_pinterest_app_id
PINTEREST_CLIENT_SECRET=your_pinterest_app_secret
# Pinterest Business ID is collected from users (not in env vars)
# https://www.pinterest.com/business/business-manager/
```

**Step 2: Verify env schema includes Pinterest vars**

Check that `apps/api/src/lib/env.ts` includes:

```typescript
PINTEREST_CLIENT_ID: z.string(),
PINTEREST_CLIENT_SECRET: z.string(),
```

If not, add them.

**Step 3: Run typecheck**

```bash
npm run typecheck --workspace=apps/api
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/.env.example
git add apps/api/src/lib/env.ts
git commit -m "docs: add Pinterest OAuth environment variables"
```

---

## Task 7: Add Pinterest to Platform Categories (if not already present)

**Files:**
- Modify: `packages/shared/src/types.ts`

**Step 1: Check if Pinterest is in PLATFORM_CATEGORIES**

```bash
grep -A5 "PLATFORM_CATEGORIES" packages/shared/src/types.ts | grep pinterest
```

Expected: Pinterest should already be there. If not, add it.

**Step 2: If not present, add to appropriate category**

```typescript
export const PLATFORM_CATEGORIES = {
  recommended: ['google', 'meta', 'linkedin', 'pinterest'] as const, // Add pinterest here
  other: ['google_ads', 'ga4', 'meta_ads', 'tiktok', ...] as const,
};
```

**Step 3: Commit if changes were made**

```bash
git add packages/shared/src/types.ts
git commit -m "feat(types): add Pinterest to recommended platform categories"
```

---

## Summary

This plan implements Pinterest Business ID collection following Agency Access's pattern:

1. **Types** - Add `PinterestConnectionMetadata` interface to shared types
2. **Frontend** - Create `PinterestBusinessIdInput` component with instructions and deep link
3. **Backend** - Add API endpoint to save Business ID to connection metadata
4. **Integration** - Wire up Business ID input into connection flow (optional, skippable)
5. **Settings** - Add Business ID display/edit in agency settings
6. **Documentation** - Update environment variables and categories

**Key Design Decisions:**
- Business ID is **optional** (Pinterest API works without it)
- Provides deep link to `https://www.pinterest.com/business/business-manager/`
- Validates format: 1-20 digits only
- Stores in `AgencyPlatformConnection.metadata.businessId`
- Allows skipping and editing later in settings

**Testing Strategy:**
- Unit tests for each component (Vitest + Testing Library)
- API route tests (supertest)
- Integration tests for flow orchestration
- Validation tests for Business ID format

**Files Created:**
- `apps/web/src/components/pinterest-business-id-input.tsx`
- `apps/web/src/components/pinterest-connection-flow.tsx`
- `apps/web/src/components/pinterest-business-settings.tsx`
- `apps/api/src/routes/agency-platforms/pinterest.routes.ts`
- Test files for all above

**Files Modified:**
- `packages/shared/src/types.ts`
- `apps/api/src/routes/agency-platforms/index.ts`
- `apps/api/.env.example`
- `apps/api/src/lib/env.ts` (if needed)

**Estimated Tasks:** 7 bite-sized tasks with TDD cycle per task
**Estimated Commits:** 7+ commits (one per task)
