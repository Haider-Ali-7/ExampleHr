import { describe, it, expect } from 'vitest';
import { queryKeys } from '@/lib/queryKeys';

describe('queryKeys', () => {
  describe('balances', () => {
    it('has a stable all key', () => {
      expect(queryKeys.balances.all).toEqual(['balances']);
    });

    it('byEmployee returns a key that starts with all', () => {
      const key = queryKeys.balances.byEmployee('emp_001');
      expect(key[0]).toBe('balances');
      expect(key[1]).toBe('emp_001');
    });

    it('byEmployee keys differ for different employee IDs', () => {
      const key1 = queryKeys.balances.byEmployee('emp_001');
      const key2 = queryKeys.balances.byEmployee('emp_002');
      expect(key1).not.toEqual(key2);
    });
  });

  describe('requests', () => {
    it('has a stable all key', () => {
      expect(queryKeys.requests.all).toEqual(['requests']);
    });

    it('byEmployee returns key with employeeId object', () => {
      const key = queryKeys.requests.byEmployee('emp_001');
      expect(key[0]).toBe('requests');
      expect(key[1]).toEqual({ employeeId: 'emp_001' });
    });

    it('byEmployee keys differ for different employee IDs', () => {
      const key1 = queryKeys.requests.byEmployee('emp_001');
      const key2 = queryKeys.requests.byEmployee('emp_002');
      expect(key1).not.toEqual(key2);
    });
  });

  describe('admin', () => {
    it('has a stable employees key', () => {
      expect(queryKeys.admin.employees).toEqual(['admin', 'employees']);
    });
  });
});
