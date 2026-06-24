import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { LeaveEvent } from '@/lib/types';

export const leaveEvents = new EventEmitter();
leaveEvents.setMaxListeners(100);

export function broadcast(event: Omit<LeaveEvent, 'id'>): void {
  leaveEvents.emit('leave', { ...event, id: randomUUID() });
}

export function createSSEStream(): ReadableStream {
  const encoder = new TextEncoder();
  let listener: ((event: LeaveEvent) => void) | null = null;

  return new ReadableStream({
    start(controller) {
      listener = (event: LeaveEvent) => {
        try {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // stream may have been closed; clean up
          if (listener) {
            leaveEvents.off('leave', listener);
            listener = null;
          }
        }
      };

      leaveEvents.on('leave', listener);
    },
    cancel() {
      if (listener) {
        leaveEvents.off('leave', listener);
        listener = null;
      }
    },
  });
}
