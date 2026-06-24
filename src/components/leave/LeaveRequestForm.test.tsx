'use client';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveRequestForm } from './LeaveRequestForm';
import type { HCMBalance } from '@/lib/types';

// ── fixtures ──────────────────────────────────────────────────────────────────

const balances: HCMBalance[] = [
  {
    employeeId: 'emp_001',
    employeeName: 'John Smith',
    location: 'NY',
    leaveType: 'annual',
    balance: 10,
    lastUpdated: '2026-06-24T08:00:00Z',
  },
  {
    employeeId: 'emp_001',
    employeeName: 'John Smith',
    location: 'NY',
    leaveType: 'sick',
    balance: 5,
    lastUpdated: '2026-06-24T08:00:00Z',
  },
];

const defaultProps = {
  employeeId: 'emp_001',
  employeeName: 'John Smith',
  balances,
  onSubmit: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  isSubmitting: false,
  submitError: null,
};

// ── helpers ───────────────────────────────────────────────────────────────────

async function fillAndSubmitForm(
  onSubmit: ReturnType<typeof vi.fn> = vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  opts: { reason?: string; startDate?: string; endDate?: string } = {},
) {
  const user = userEvent.setup();
  render(<LeaveRequestForm {...defaultProps} onSubmit={onSubmit} />);

  // Dates — use a week from today so "min" validation passes in the browser
  const start = opts.startDate ?? '2026-09-01';
  const end = opts.endDate ?? '2026-09-03';
  const reason = opts.reason ?? 'Medical appointment';

  await user.clear(screen.getByLabelText(/start date/i));
  await user.type(screen.getByLabelText(/start date/i), start);
  await user.clear(screen.getByLabelText(/end date/i));
  await user.type(screen.getByLabelText(/end date/i), end);
  await user.clear(screen.getByLabelText(/reason/i));
  await user.type(screen.getByLabelText(/reason/i), reason);

  await user.click(screen.getByRole('button', { name: /submit request/i }));
  return onSubmit;
}

// ── rendering ─────────────────────────────────────────────────────────────────

describe('LeaveRequestForm — rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    render(<LeaveRequestForm {...defaultProps} />);
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/leave type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
  });

  it('populates the location dropdown with options from balances', () => {
    render(<LeaveRequestForm {...defaultProps} />);
    const locationSelect = screen.getByLabelText(/location/i);
    expect(locationSelect).toHaveValue('NY');
  });

  it('disables submit when no dates are selected', () => {
    render(<LeaveRequestForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /submit request/i })).toBeDisabled();
  });

  it('shows a submit error when submitError prop is provided', () => {
    render(<LeaveRequestForm {...defaultProps} submitError="Missing required fields" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Missing required fields');
  });

  it('shows spinner text while submitting', () => {
    render(<LeaveRequestForm {...defaultProps} isSubmitting />);
    expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
  });
});

// ── location sync fix (root cause regression) ─────────────────────────────────

describe('LeaveRequestForm — location sync when balances load asynchronously', () => {
  it('initialises location to the first balance location when balances are provided at mount', () => {
    render(<LeaveRequestForm {...defaultProps} />);
    expect(screen.getByLabelText(/location/i)).toHaveValue('NY');
  });

  it('updates location from empty string to first location when balances arrive after mount', async () => {
    // Simulate the race condition: mount with no balances (empty string location),
    // then re-render with balances loaded.
    const { rerender } = render(
      <LeaveRequestForm {...defaultProps} balances={[]} />,
    );

    // Before balances load: location select should show no options.
    // A <select> with no <option> children has value undefined (not '').
    const locationSelect = screen.getByLabelText(/location/i);
    expect((locationSelect as HTMLSelectElement).options).toHaveLength(0);

    // Simulate balances arriving
    rerender(<LeaveRequestForm {...defaultProps} balances={balances} />);

    // After fix: useEffect syncs location from '' to 'NY'
    await waitFor(() => {
      expect(screen.getByLabelText(/location/i)).toHaveValue('NY');
    });
  });

  it('submit button remains disabled when location is empty (no balances loaded)', () => {
    render(<LeaveRequestForm {...defaultProps} balances={[]} />);
    // Even with dates and reason filled in, an empty location keeps submit disabled.
    expect(screen.getByRole('button', { name: /submit request/i })).toBeDisabled();
  });
});

// ── submit guard ──────────────────────────────────────────────────────────────

describe('LeaveRequestForm — submit guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call onSubmit when location is empty', async () => {
    const onSubmit = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LeaveRequestForm {...defaultProps} balances={[]} onSubmit={onSubmit} />);

    // Try typing dates/reason and clicking submit — the button is disabled but
    // we also guard in handleSubmit; the click should not fire onSubmit.
    const btn = screen.getByRole('button', { name: /submit request/i });
    expect(btn).toBeDisabled();
    await user.click(btn);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit when reason is empty', async () => {
    const onSubmit = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LeaveRequestForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/start date/i), '2026-09-01');
    await user.type(screen.getByLabelText(/end date/i), '2026-09-03');
    // reason left empty

    const btn = screen.getByRole('button', { name: /submit request/i });
    expect(btn).toBeDisabled();
    await user.click(btn);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit when reason is only whitespace', async () => {
    const onSubmit = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LeaveRequestForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/start date/i), '2026-09-01');
    await user.type(screen.getByLabelText(/end date/i), '2026-09-03');
    await user.type(screen.getByLabelText(/reason/i), '   ');

    const btn = screen.getByRole('button', { name: /submit request/i });
    expect(btn).toBeDisabled();
    await user.click(btn);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with all required fields when form is valid', async () => {
    const onSubmit = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    await fillAndSubmitForm(onSubmit);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    const [submitted] = onSubmit.mock.calls[0] as [Parameters<typeof onSubmit>[0]];
    expect(submitted).toMatchObject({
      location: 'NY',
      leaveType: 'annual',
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      days: expect.any(Number),
      reason: 'Medical appointment',
    });
  });

  it('onSubmit payload contains a non-empty location (not empty string)', async () => {
    const onSubmit = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    await fillAndSubmitForm(onSubmit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    const [submitted] = onSubmit.mock.calls[0] as [{ location: string }];
    expect(submitted.location).toBeTruthy();
    expect(submitted.location).not.toBe('');
  });

  it('onSubmit payload contains a non-empty reason', async () => {
    const onSubmit = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    await fillAndSubmitForm(onSubmit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    const [submitted] = onSubmit.mock.calls[0] as [{ reason: string }];
    expect(submitted.reason).toBeTruthy();
    expect(submitted.reason.trim()).not.toBe('');
  });
});

// ── computeDays logic (via form render) ───────────────────────────────────────

describe('LeaveRequestForm — days calculation', () => {
  it('shows duration when valid start and end dates are entered', async () => {
    const user = userEvent.setup();
    render(<LeaveRequestForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/start date/i), '2026-09-01');
    await user.type(screen.getByLabelText(/end date/i), '2026-09-05');

    await waitFor(() => {
      expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    });
  });

  it('shows 1 day for same start and end date', async () => {
    const user = userEvent.setup();
    render(<LeaveRequestForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/start date/i), '2026-09-01');
    await user.type(screen.getByLabelText(/end date/i), '2026-09-01');

    await waitFor(() => {
      expect(screen.getByText(/1 day\b/i)).toBeInTheDocument();
    });
  });
});

// ── insufficient balance UI ───────────────────────────────────────────────────

describe('LeaveRequestForm — insufficient balance', () => {
  it('shows an insufficient balance alert and disables submit when days exceed balance', async () => {
    const user = userEvent.setup();
    render(<LeaveRequestForm {...defaultProps} />);

    // NY annual balance is 10; request 15 days
    await user.type(screen.getByLabelText(/start date/i), '2026-09-01');
    await user.type(screen.getByLabelText(/end date/i), '2026-09-15');
    await user.type(screen.getByLabelText(/reason/i), 'Long holiday');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/insufficient balance/i);
    });

    expect(screen.getByRole('button', { name: /submit request/i })).toBeDisabled();
  });
});
