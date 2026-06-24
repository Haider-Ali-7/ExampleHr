"use client";

import { useState, useEffect, useRef } from "react";
import type { LeaveEvent } from "@/lib/types";

interface UseLeaveSSEReturn {
  isConnected: boolean;
  lastEvent: LeaveEvent | null;
  lastSync: string | null;
  error: string | null;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export function useLeaveSSE(): UseLeaveSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LeaveEvent | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let unmounted = false;

    function scheduleRetry() {
      if (unmounted) return;
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        setError(
          `Connection lost. Reconnecting… (attempt ${retryCountRef.current}/${MAX_RETRIES})`
        );
        retryTimerRef.current = setTimeout(() => {
          if (!unmounted) connect();
        }, RETRY_DELAY_MS);
      } else {
        setError("Unable to connect to the live update stream. Please refresh the page.");
      }
    }

    function connect() {
      if (unmounted) return;

      const es = new EventSource("/api/leave/stream");
      esRef.current = es;

      es.onopen = () => {
        if (unmounted) return;
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0;
      };

      es.onmessage = (event: MessageEvent) => {
        if (unmounted) return;
        try {
          const parsed = JSON.parse(event.data as string) as LeaveEvent;
          if (parsed.id && seenIdsRef.current.has(parsed.id)) return;
          if (parsed.id) seenIdsRef.current.add(parsed.id);
          setLastEvent(parsed);
          setLastSync(parsed.timestamp);
        } catch {
          // malformed message — ignore
        }
      };

      es.onerror = () => {
        if (unmounted) return;
        es.close();
        esRef.current = null;
        setIsConnected(false);
        scheduleRetry();
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      esRef.current?.close();
      esRef.current = null;
    };
  }, []);

  return { isConnected, lastEvent, lastSync, error };
}
