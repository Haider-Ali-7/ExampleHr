# HCM Leave Management System

A real-time Human Capital Management (HCM) leave management application built with Next.js 16, React 19, and TanStack Query.

## Tech Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Framework       | Next.js 16 (App Router)            |
| UI              | React 19, Tailwind CSS v4          |
| Server State    | TanStack Query v5                  |
| Client State    | Zustand v5                         |
| Real-time       | Server-Sent Events (SSE)           |
| Testing         | Vitest 4, Storybook 10, Playwright |
| Package Manager | Bun                                |

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Test Credentials

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Employee | employee1@gmail.com | 123456   |
| Employee | employee2@gmail.com | 123456   |
| Manager  | manager1@gmail.com  | 123456   |
| Admin    | admin1@gmail.com    | 123456   |

## Documentation

### Technical Reference Document (TRD)

The comprehensive TRD covers frontend/backend architecture, challenges faced, solutions adopted, and reasoning for optimistic updates and background refresh patterns.

**Access the TRD:**

```bash
# Open in default browser
open docs/TRD.html

# Or serve via a local server
bunx serve docs
```

The TRD includes:

- Executive Summary
- Frontend Architecture (React 19, TanStack Query, SSE patterns)
- Backend Architecture (API routes, HCM data layer, SSE broadcast)
- Optimistic Updates & Background Refresh reasoning
- Challenges & Solutions
- Testing Strategy

## Commands

```bash
bun dev              # Start Next.js dev server (localhost:3000)
bun build            # Production build
bun lint             # ESLint
bun storybook        # Start Storybook (localhost:6006)
bun build-storybook  # Build static Storybook
```

## Testing

### Test Commands

```bash
bun test             # Run all tests (unit + Storybook interaction)
bun test:unit        # Run unit tests only (jsdom)
bun test:storybook   # Run Storybook interaction tests (headless Chromium)
bun test:watch       # Watch mode
bun test:coverage    # Generate coverage report
```

### Test Architecture

The project uses a dual-project Vitest configuration:

| Project     | Environment           | Purpose                                     |
| ----------- | --------------------- | ------------------------------------------- |
| `unit`      | jsdom                 | Unit tests for hooks, utilities, API routes |
| `storybook` | Playwright (Chromium) | Interaction tests via Storybook             |

### Test Coverage

Coverage is generated using V8 provider with reports in `text`, `json`, and `html` formats.

```bash
# Generate coverage report
bun test:coverage

# View HTML report
open coverage/index.html
```

**Coverage includes:**

- `src/**/*.{ts,tsx}` — All source files

**Coverage excludes:**

- `*.stories.{ts,tsx}` — Storybook stories
- `*.test.{ts,tsx}` — Test files
- `src/**/index.ts` — Barrel exports
- `src/app/layout.tsx` — Root layout

### Test File Locations

```
src/
├── lib/
│   ├── auth.test.ts          # User validation tests
│   ├── hcm.test.ts           # HCM data layer tests
│   ├── queryClient.test.ts   # Query client factory tests
│   ├── queryKeys.test.ts     # Query key structure tests
│   └── sse.test.ts           # SSE broadcast tests
├── hooks/
│   └── useEmployeeLeave.test.ts  # Employee hook tests
├── components/
│   └── leave/
│       └── LeaveRequestForm.test.tsx  # Form component tests
├── app/api/
│   └── leave/requests/
│       └── route.test.ts     # API route integration tests
└── stories/
    └── leave/
        ├── BalanceCard.stories.tsx      # Balance display
        ├── BalanceGrid.stories.tsx      # Balance grid layout
        ├── LeaveRequestForm.stories.tsx # Request form interactions
        ├── LoginForm.stories.tsx        # Auth form interactions
        ├── RequestCard.stories.tsx      # Request card states
        ├── RequestList.stories.tsx      # List with actions
        ├── StatusBadge.stories.tsx      # Status variants
        ├── SyncIndicator.stories.tsx    # Sync states
        ├── StaleBalanceBanner.stories.tsx
        └── Toast.stories.tsx            # Notification types
```

### Running Tests

```bash
# Run all tests with verbose output
bun test --reporter=verbose

# Run specific test file
bun test src/lib/auth.test.ts

# Run tests matching pattern
bun test --grep "leave request"

# Run Storybook tests only
bun test:storybook
```

## Storybook

Interactive component documentation and testing.

**Live Demo:** [example-hr-amber.vercel.app](https://example-hr-amber.vercel.app)

```bash
bun storybook        # Start at localhost:6006
bun build-storybook  # Build static site
```

Storybook includes:

- All leave management components
- Interaction tests with `@storybook/test`
- Accessibility auditing via `@storybook/addon-a11y`
- Chromatic visual regression (optional)

## Project Structure

```
src/
├── app/              # Next.js App Router (pages + API routes)
├── components/       # React components
│   └── leave/        # Leave management UI
├── hooks/            # Custom React hooks (TanStack Query + SSE)
├── lib/              # Utilities, types, data access
├── store/            # Zustand stores (auth)
└── stories/          # Storybook stories
docs/
└── TRD.html          # Technical Reference Document
```

## License

Private project.
