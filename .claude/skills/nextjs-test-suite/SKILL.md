---
name: nextjs-test-suite
description: Comprehensive testing skill for Next.js + Tailwind CSS + Storybook projects. Runs Storybook interaction tests, Chromatic regression tests, component tests, unit tests for utilities/hooks/helpers, and API integration tests with mocking. Automatically fixes broken functionality and bugs discovered during testing. Use when asked to "test", "run tests", "check tests", "test components", "test hooks", "test utilities", "test API", "run regression tests", "check for bugs", "verify functionality", "fix tests", or "debug tests".
---

# Next.js Test Suite

A comprehensive testing skill that validates Next.js applications with Tailwind CSS and Storybook through multiple testing strategies. Automatically identifies and fixes bugs discovered during testing.

## What This Skill Does

1. **Storybook Interaction Tests** - Tests component behavior via play functions
2. **Chromatic Regression Tests** - Visual regression testing setup
3. **Component Tests** - React Testing Library tests for components
4. **Unit Tests** - Tests for utilities, hooks, helpers, and functions
5. **API Integration Tests** - Mocked API endpoint testing
6. **Bug Detection & Fixing** - Identifies root causes and applies fixes

## Required Dependencies

Before running tests, verify these packages are in `devDependencies`:

```json
{
  "@testing-library/react": "^16.x",
  "@testing-library/user-event": "^14.x",
  "@testing-library/jest-dom": "^6.x",
  "eslint-plugin-jest-dom": "^5.x",
  "eslint-plugin-testing-library": "^7.x",
  "vitest": "^4.x",
  "@vitejs/plugin-react": "^6.x",
  "jsdom": "^29.x",
  "vite-tsconfig-paths": "^6.x"
}
```

If missing, install with: `bun add -d <package-name>`

## Test Execution Flow

### Phase 1: Verify Setup

1. Check all required dependencies are installed
2. Verify `vitest.config.ts` has proper configuration
3. Check Storybook addons are configured (`@storybook/addon-vitest`, `@storybook/addon-a11y`)
4. Verify ESLint plugins for testing are configured

### Phase 2: Run Tests by Category

Execute tests in this order:

```bash
# 1. Run all Vitest tests (includes Storybook integration)
bun test

# 2. Run with coverage
bun test --coverage

# 3. Run specific test file
bun test <path-to-test>
```

### Phase 3: Analyze and Fix Failures

For each failing test:

1. **Identify** - Locate the failing test and component/function under test
2. **Diagnose** - Read test file and implementation to find root cause
3. **Classify** - Determine if it's a test bug or implementation bug
4. **Fix** - Apply the appropriate fix
5. **Verify** - Re-run the test to confirm fix
6. **Document** - Explain what was wrong and how it was fixed

## Bug Classification and Fixing Strategy

### Implementation Bugs (Fix the Code)

When the test is correct but the implementation is broken:

| Bug Type | Detection Pattern | Fix Strategy |
|----------|-------------------|--------------|
| Missing null check | `Cannot read property of undefined` | Add optional chaining or guard clause |
| Race condition | Flaky test, intermittent failures | Add proper async handling, use `waitFor` |
| State not updating | Assertion fails after action | Check state setter, verify re-render trigger |
| Wrong return type | Type mismatch in assertion | Fix function return type/value |
| Missing dependency | Hook stale closure | Add to useEffect/useCallback deps array |
| Event handler bug | Click/interaction not working | Check handler binding, event propagation |
| API response handling | Wrong data shape | Fix response parsing, add validation |

### Test Bugs (Fix the Test)

When the implementation is correct but the test is wrong:

| Bug Type | Detection Pattern | Fix Strategy |
|----------|-------------------|--------------|
| Wrong selector | Element not found | Use correct role/text/testid |
| Missing async | Promise not awaited | Add `await`, use `waitFor` |
| Wrong assertion | Value mismatch | Fix expected value |
| Missing setup | Undefined dependencies | Add proper mocks/providers |
| Timing issue | Element not yet rendered | Add `waitFor` or `findBy` |
| Mock not configured | Fetch/API not mocked | Add proper mock setup |

## Fix Patterns by Category

### Component Rendering Fixes

```tsx
// Problem: Component crashes on undefined prop
// Before
function Component({ data }) {
  return <div>{data.items.map(...)}</div>;
}

// After
function Component({ data }) {
  if (!data?.items) return null;
  return <div>{data.items.map(...)}</div>;
}
```

### Hook State Fixes

```tsx
// Problem: Stale closure in useEffect
// Before
useEffect(() => {
  fetchData(id);
}, []);

// After
useEffect(() => {
  fetchData(id);
}, [id, fetchData]);
```

### Async Operation Fixes

```tsx
// Problem: State update after unmount
// Before
useEffect(() => {
  fetch(url).then(data => setData(data));
}, [url]);

// After
useEffect(() => {
  let cancelled = false;
  fetch(url).then(data => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, [url]);
```

### Event Handler Fixes

```tsx
// Problem: Handler not receiving event
// Before
<button onClick={handleClick(id)}>Click</button>

// After
<button onClick={() => handleClick(id)}>Click</button>
```

### Test Selector Fixes

```tsx
// Problem: Element not found by text
// Before
screen.getByText('Submit');

// After (more resilient)
screen.getByRole('button', { name: /submit/i });
```

### Async Test Fixes

```tsx
// Problem: Assertion runs before render
// Before
render(<AsyncComponent />);
expect(screen.getByText('Loaded')).toBeInTheDocument();

// After
render(<AsyncComponent />);
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Test File Patterns

### Component Tests (`*.test.tsx`)

Location: Colocate with component or in `__tests__/` directory

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ComponentName onClick={onClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Hook Tests (`*.test.ts`)

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomHook } from './useCustomHook';

describe('useCustomHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCustomHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useCustomHook());
    act(() => {
      result.current.setValue('new value');
    });
    expect(result.current.value).toBe('new value');
  });
});
```

### Utility/Helper Tests (`*.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { utilityFunction } from './utilities';

describe('utilityFunction', () => {
  it('handles normal input', () => {
    expect(utilityFunction('input')).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(utilityFunction('')).toBe('');
    expect(utilityFunction(null)).toBeNull();
  });
});
```

### API Integration Tests (`*.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API Integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await fetchData('/api/endpoint');
    
    expect(fetch).toHaveBeenCalledWith('/api/endpoint');
    expect(result).toEqual(mockData);
  });

  it('handles API errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(fetchData('/api/not-found')).rejects.toThrow('Not Found');
  });
});
```

### Storybook Interaction Tests (in `*.stories.ts`)

```ts
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Component } from './Component';

const meta = {
  title: 'Components/Component',
  component: Component,
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInteraction: Story = {
  args: {
    label: 'Click me',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /click me/i });
    
    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

## Vitest Configuration

The project should have `vitest.config.ts` configured for:

1. **Storybook tests** - Browser-based with Playwright
2. **Unit/Component tests** - jsdom environment

### Extended Configuration for Unit Tests

If you need to add unit test support alongside Storybook tests:

```ts
// vitest.config.ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const dirname = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    projects: [
      // Storybook browser tests
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      // Unit and component tests with jsdom
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.stories.*'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
```

### Test Setup File

Create `vitest.setup.ts` for jest-dom matchers:

```ts
import '@testing-library/jest-dom/vitest';
```

## ESLint Configuration for Testing

Add testing plugins to `eslint.config.mjs`:

```js
import storybook from 'eslint-plugin-storybook';
import testingLibrary from 'eslint-plugin-testing-library';
import jestDom from 'eslint-plugin-jest-dom';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    ...testingLibrary.configs['flat/react'],
    ...jestDom.configs['flat/recommended'],
  },
]);
```

## Chromatic Setup for Visual Regression

1. Install Chromatic: `bun add -d chromatic`

2. Add script to `package.json`:
```json
{
  "scripts": {
    "chromatic": "chromatic --exit-zero-on-changes"
  }
}
```

3. Run with project token:
```bash
CHROMATIC_PROJECT_TOKEN=<token> bun chromatic
```

## Execution Checklist

When running this skill:

1. **Verify Dependencies**
   - [ ] All testing packages installed
   - [ ] ESLint plugins configured
   - [ ] Vitest config supports needed test types

2. **Run Test Suite**
   - [ ] Execute `bun test`
   - [ ] Check for failures
   - [ ] Run coverage if requested

3. **For Each Failure - Diagnose**
   - [ ] Identify failing test and file
   - [ ] Read test code and implementation
   - [ ] Classify as test bug or implementation bug
   - [ ] Identify root cause

4. **For Each Failure - Fix**
   - [ ] Apply fix to correct file (test or implementation)
   - [ ] Re-run test to verify fix
   - [ ] Check for side effects on other tests
   - [ ] Document the fix

5. **Report Results**
   - [ ] List passing tests summary
   - [ ] Detail each failure with diagnosis and fix applied
   - [ ] Suggest additional test coverage gaps
   - [ ] Recommend improvements for better testability

## Common Issues and Fixes

### Issue: "Cannot find module '@testing-library/jest-dom'"
**Fix:** Install and configure setup file:
```bash
bun add -d @testing-library/jest-dom
```
Add to `vitest.setup.ts`: `import '@testing-library/jest-dom/vitest'`

### Issue: "document is not defined"
**Fix:** Ensure test is running with jsdom environment:
```ts
// Add at top of test file if not using global config
// @vitest-environment jsdom
```

### Issue: Storybook tests timing out
**Fix:** Increase timeout in vitest config or use `waitFor`:
```ts
play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => {
    expect(canvas.getByText('Loaded')).toBeInTheDocument();
  }, { timeout: 5000 });
},
```

### Issue: Mock not resetting between tests
**Fix:** Use `beforeEach`/`afterEach` hooks:
```ts
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Issue: React state not updating in test
**Fix:** Wrap state changes in `act()`:
```ts
await act(async () => {
  await userEvent.click(button);
});
```

### Issue: Query returns null for async content
**Fix:** Use `findBy` queries instead of `getBy`:
```ts
const element = await screen.findByText('Loaded');
```

### Issue: Hook test fails with "Invalid hook call"
**Fix:** Wrap hook in `renderHook`:
```ts
const { result } = renderHook(() => useMyHook(), {
  wrapper: ({ children }) => <Provider>{children}</Provider>,
});
```

### Issue: Fetch not mocked
**Fix:** Stub fetch globally:
```ts
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});
```

### Issue: Component needs providers
**Fix:** Create custom render with providers:
```tsx
function renderWithProviders(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    ),
  });
}
```

## Improvement Suggestions

After fixing failures, suggest improvements:

1. **Test Coverage Gaps** - Identify untested code paths
2. **Flaky Test Prevention** - Replace timing-dependent assertions
3. **Test Isolation** - Ensure tests don't share state
4. **Mock Consistency** - Centralize mock definitions
5. **Accessibility Testing** - Add a11y checks to component tests
6. **Error Boundary Testing** - Test error states
7. **Edge Case Coverage** - Test null, undefined, empty arrays
8. **Performance Testing** - Add render count assertions for hooks

## Accessing Up-to-Date Documentation

When implementing tests, use Context7 MCP to fetch current documentation:

1. **Testing Library**: Resolve `@testing-library/react` for render, queries, userEvent
2. **Vitest**: Resolve `vitest` for test APIs, mocking, configuration
3. **Storybook**: Resolve `storybook` for interaction testing, play functions
4. **Next.js**: Resolve `next` for testing patterns with App Router

Query pattern: "How to test [specific scenario] with [library]"
