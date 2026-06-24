# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
bun dev              # Start Next.js dev server (localhost:3000)
bun build            # Production build
bun lint             # ESLint (flat config)
bun test             # Run Vitest (Storybook integration tests in headless Chromium)
bun storybook        # Start Storybook dev server (localhost:6006)
bun build-storybook  # Build static Storybook
```

## Tech Stack

- **Next.js 16** with App Router (React 19, Tailwind CSS v4)
- **Storybook 10** with `@storybook/nextjs-vite` framework
- **Vitest 4** with Playwright browser provider for component tests
- **TanStack Query 5** for server state management
- **Zustand 5** for client state (auth only)
- **Bun** as package manager

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout with Providers + NavBar
│   ├── page.tsx              # Home page
│   ├── login/page.tsx        # Login page
│   ├── employee/page.tsx     # Employee dashboard
│   ├── manager/page.tsx      # Manager dashboard
│   ├── admin/page.tsx        # Admin/HCM dashboard
│   └── api/                  # Route handlers
│       ├── auth/             # login, me
│       ├── admin/employees/  # Admin employee list
│       └── leave/            # balances, requests, hcm, stream (SSE)
├── components/
│   ├── AuthGuard.tsx         # Role-based route protection
│   ├── NavBar.tsx            # Auth-aware navigation
│   ├── Providers.tsx         # QueryClientProvider wrapper
│   └── leave/                # Leave management components
│       ├── BalanceCard.tsx
│       ├── BalanceCell.tsx   # Editable cell for admin
│       ├── BalanceGrid.tsx
│       ├── EmployeeTable.tsx # Admin table view
│       ├── LeaveRequestForm.tsx
│       ├── LoginForm.tsx
│       ├── RequestCard.tsx
│       ├── RequestList.tsx
│       ├── StaleBalanceBanner.tsx
│       ├── StatusBadge.tsx
│       ├── SyncIndicator.tsx
│       ├── Toast.tsx
│       └── ToastContainer.tsx
├── hooks/
│   ├── useAdminLeave.ts      # Admin dashboard hook (TanStack Query)
│   ├── useEmployeeLeave.ts   # Employee dashboard hook (TanStack Query)
│   ├── useLeaveSSE.ts        # SSE subscription for real-time updates
│   ├── useManagerLeave.ts    # Manager dashboard hook (TanStack Query)
│   └── useHCMSimulator.ts    # HCM balance update helper
├── lib/
│   ├── auth.ts               # User validation
│   ├── hcm.ts                # HCM data access (JSON file)
│   ├── hcm-data.json         # Simulated HCM database
│   ├── queryClient.ts        # TanStack Query client factory
│   ├── queryKeys.ts          # Centralized query keys
│   ├── sse.ts                # SSE broadcast utilities
│   └── types.ts              # TypeScript types
├── store/
│   └── authStore.ts          # Zustand auth store with persist
└── stories/
    ├── leave/                # Leave component stories
    └── *.stories.tsx         # Storybook example stories
```

Path alias: `@/*` maps to `./src/*`

## Authentication

Client-side auth via Zustand with localStorage persistence. No server-side sessions.

**Test credentials:**
- `employee1@gmail.com` / `123456` → emp_001 (John Smith)
- `employee2@gmail.com` / `123456` → emp_002 (Sarah Johnson)
- `employee3@gmail.com` / `123456` → emp_003 (Marcus Chen)
- `manager1@gmail.com` / `123456` → Manager role
- `admin1@gmail.com` / `123456` → Admin role

## State Management Patterns

### TanStack Query (Server State)

Use for all API data. Query keys defined in `src/lib/queryKeys.ts`:

```typescript
queryKeys.balances.all                    // ['balances']
queryKeys.balances.byEmployee(id)         // ['balances', id]
queryKeys.requests.all                    // ['requests']
queryKeys.requests.byEmployee(id)         // ['requests', { employeeId: id }]
queryKeys.admin.employees                 // ['admin', 'employees']
```

### Zustand (Client State)

Only used for auth. Access via `useAuthStore`:

```typescript
const user = useAuthStore((s) => s.user);
const { login, logout } = useAuthStore();
```

### SSE Real-Time Updates

`useLeaveSSE` subscribes to `/api/leave/stream`. Event types:
- `balance_updated` / `hcm_sync` → invalidate balances
- `request_created` → invalidate requests
- `request_decided` → invalidate requests + balances

## Component Patterns

### Page with AuthGuard

```typescript
export default function ProtectedPage() {
  return (
    <AuthGuard requiredRole="employee">
      <Dashboard />
    </AuthGuard>
  );
}
```

### Hook with TanStack Query + SSE

```typescript
export function useFeatureData() {
  const queryClient = useQueryClient();
  const { lastEvent } = useLeaveSSE();

  const query = useQuery({
    queryKey: queryKeys.feature.all,
    queryFn: fetchFeatureData,
    staleTime: 30000,
  });

  useEffect(() => {
    if (lastEvent?.type === 'feature_updated') {
      queryClient.invalidateQueries({ queryKey: queryKeys.feature.all });
    }
  }, [lastEvent, queryClient]);

  return { data: query.data, isLoading: query.isLoading };
}
```

### Optimistic Mutation

```typescript
const mutation = useMutation({
  mutationFn: submitData,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (old) => [...old, optimisticItem]);
    return { previous };
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(queryKey, context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

## Storybook Patterns

Stories live in `src/stories/` or `src/stories/leave/`. Use CSF 3.0 format:

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';

const meta = {
  title: 'Leave/ComponentName',
  component: ComponentName,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { ... },
};
```

**Required story states for components:**
- loading, empty, stale
- optimistic-pending, optimistic-rolled-back
- error states

## API Route Patterns

Route handlers in `src/app/api/`. Use Next.js route handler format:

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = await fetchData(searchParams.get('id'));
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  // Validate required fields
  if (!body.field) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const result = await createData(body);
  return NextResponse.json({ result }, { status: 201 });
}
```

## Tailwind CSS v4

- Config via `@theme inline` directive in `globals.css` (no `tailwind.config.js`)
- CSS variables define design tokens (`--background`, `--foreground`, `--font-sans`, `--font-mono`)
- Dark mode via `prefers-color-scheme` media query
- Use canonical classes: `shrink-0` not `flex-shrink-0`

## Types

Core types in `src/lib/types.ts`:
- `User`, `UserRole` — auth
- `HCMBalance`, `LeaveRequest`, `LeaveType`, `RequestStatus` — domain
- `LeaveEvent` — SSE events
- `CreateRequestBody`, `DecideRequestBody` — API payloads
