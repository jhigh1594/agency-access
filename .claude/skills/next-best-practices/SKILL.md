---
name: next-best-practices
description: Next.js App Router patterns and best practices. Use when building pages, implementing data fetching, configuring caching, or optimizing performance.
---

# Next.js Best Practices (App Router)

## Server vs Client Components

### Default to Server Components
```tsx
// app/dashboard/page.tsx (Server Component by default)
export default async function DashboardPage() {
  const data = await fetchDashboardData();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <DashboardStats data={data} />
    </div>
  );
}
```

### Use Client Components When Needed
```tsx
// components/counter.tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

### When to Use Client Components
- useState, useEffect, useContext
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries that use hooks

## Data Fetching

### Server Component Fetching
```tsx
// Fetch in Server Components
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <DataDisplay data={data} />;
}
```

### Parallel Data Fetching
```tsx
export default async function Page() {
  // Fetch in parallel, not sequentially
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts()
  ]);
  
  return (
    <>
      <UserList users={users} />
      <PostList posts={posts} />
    </>
  );
}
```

### Client-Side Fetching (TanStack Query)
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function ConnectionsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['connections'],
    queryFn: () => fetch('/api/connections').then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ConnectionsTable data={data} />;
}
```

## Caching Strategies

### Static (Default)
```tsx
// Cached at build time, shared across requests
async function getStaticData() {
  const res = await fetch('https://api.example.com/static');
  return res.json();
}
```

### Time-Based Revalidation
```tsx
// Revalidate every hour
async function getTimedData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }
  });
  return res.json();
}
```

### On-Demand Revalidation
```tsx
// In Server Action or Route Handler
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateData() {
  await saveToDatabase();
  
  revalidatePath('/dashboard');
  // or
  revalidateTag('dashboard-data');
}
```

### No Cache
```tsx
// Always fetch fresh
async function getDynamicData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  });
  return res.json();
}
```

## Loading & Error States

### Loading UI
```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

### Error Handling
```tsx
// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-8">
      <h2>Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

### Suspense Boundaries
```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>
      
      <Suspense fallback={<TableSkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

## Server Actions

### Form Actions
```tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createAccessRequest(formData: FormData) {
  const clientId = formData.get('clientId');
  const platforms = formData.getAll('platforms');
  
  await prisma.accessRequest.create({
    data: { clientId, platforms }
  });
  
  revalidatePath('/access-requests');
}

// In component
<form action={createAccessRequest}>
  <input name="clientId" />
  <Button type="submit">Create</Button>
</form>
```

### With useTransition
```tsx
'use client';

import { useTransition } from 'react';

export function CreateButton() {
  const [isPending, startTransition] = useTransition();
  
  return (
    <Button
      disabled={isPending}
      onClick={() => startTransition(() => createAction())}
    >
      {isPending ? 'Creating...' : 'Create'}
    </Button>
  );
}
```

## Route Handlers

### API Routes
```tsx
// app/api/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  
  const connections = await getConnections({ page: parseInt(page) });
  
  return NextResponse.json({ data: connections });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const result = await createConnection(body);
  
  return NextResponse.json({ data: result }, { status: 201 });
}
```

## Performance

### Image Optimization
```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // For above-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Dynamic Imports
```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Client-only component
});
```

### Metadata
```tsx
// app/dashboard/page.tsx
export const metadata = {
  title: 'Dashboard | Agency Access Platform',
  description: 'Manage your agency connections',
};
```
