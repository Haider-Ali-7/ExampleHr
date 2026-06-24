import { describe, it, expect } from 'vitest';
import { makeQueryClient } from '@/lib/queryClient';
import { QueryClient } from '@tanstack/react-query';

describe('makeQueryClient', () => {
  it('returns a QueryClient instance', () => {
    const client = makeQueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });

  it('creates a new instance on each call (no singleton)', () => {
    const a = makeQueryClient();
    const b = makeQueryClient();
    expect(a).not.toBe(b);
  });

  it('has staleTime set to 30 seconds', () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30000);
  });

  it('has retry set to 3', () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(3);
  });
});
