import { createSSEStream } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const stream = createSSEStream();

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
