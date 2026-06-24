import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { broadcast, createSSEStream, leaveEvents } from '@/lib/sse';
import type { LeaveEvent } from '@/lib/types';

describe('broadcast', () => {
  beforeEach(() => {
    leaveEvents.removeAllListeners('leave');
  });

  afterEach(() => {
    leaveEvents.removeAllListeners('leave');
  });

  it('emits a leave event with an auto-generated id', () => {
    const received: LeaveEvent[] = [];
    leaveEvents.on('leave', (e: LeaveEvent) => received.push(e));

    broadcast({
      type: 'balance_updated',
      payload: { employeeId: 'emp_001', location: 'NY', leaveType: 'annual', balance: 10, employeeName: 'John Smith', lastUpdated: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('balance_updated');
    expect(typeof received[0].id).toBe('string');
    expect(received[0].id.length).toBeGreaterThan(0);
  });

  it('assigns a unique id to each broadcast', () => {
    const ids: string[] = [];
    leaveEvents.on('leave', (e: LeaveEvent) => ids.push(e.id));

    const base = {
      type: 'hcm_sync' as const,
      payload: { employeeId: 'emp_001', location: 'NY' },
      timestamp: new Date().toISOString(),
    };

    broadcast(base);
    broadcast(base);

    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('passes payload and timestamp through unchanged', () => {
    const received: LeaveEvent[] = [];
    leaveEvents.on('leave', (e: LeaveEvent) => received.push(e));

    const payload = { employeeId: 'emp_002', location: 'London' };
    broadcast({
      type: 'hcm_sync',
      payload,
      timestamp: '2026-06-24T00:00:00Z',
    });

    expect(received[0].payload).toEqual(payload);
    expect(received[0].timestamp).toBe('2026-06-24T00:00:00Z');
  });
});

describe('createSSEStream', () => {
  beforeEach(() => {
    leaveEvents.removeAllListeners('leave');
  });

  afterEach(() => {
    leaveEvents.removeAllListeners('leave');
  });

  it('returns a ReadableStream', () => {
    const stream = createSSEStream();
    expect(stream).toBeInstanceOf(ReadableStream);
    stream.cancel();
  });

  it('encodes broadcast events as SSE data lines', async () => {
    const stream = createSSEStream();
    const reader = stream.getReader();

    const event = {
      type: 'request_created' as const,
      payload: { employeeId: 'emp_001', location: 'NY', leaveType: 'annual' as const, balance: 10, employeeName: 'John Smith', lastUpdated: new Date().toISOString() },
      timestamp: '2026-06-24T10:00:00Z',
    };

    // broadcast after a tick so the stream's start() listener is registered
    setTimeout(() => broadcast(event), 0);

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    expect(text).toMatch(/^data: /);
    const parsed = JSON.parse(text.replace(/^data: /, '').trim()) as LeaveEvent;
    expect(parsed.type).toBe('request_created');
    expect(typeof parsed.id).toBe('string');

    await reader.cancel();
  });

  it('removes the event listener when the stream is cancelled', () => {
    const listenersBefore = leaveEvents.listenerCount('leave');
    const stream = createSSEStream();
    // The listener is added in start(), which runs synchronously when a reader is obtained.
    const reader = stream.getReader();
    const listenersAfterStart = leaveEvents.listenerCount('leave');
    expect(listenersAfterStart).toBe(listenersBefore + 1);

    return new Promise<void>((resolve) => {
      reader.cancel().then(() => {
        setTimeout(() => {
          expect(leaveEvents.listenerCount('leave')).toBe(listenersBefore);
          resolve();
        }, 10);
      });
    });
  });
});
