import { useCallback, useEffect, useRef } from "react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_START_KEY = "session_start_ts";

const USER_ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

/**
 * Enforces SDEV-01 REQ-356 session timeout requirements:
 * - 30-minute idle timeout (no user interaction)
 * - 8-hour absolute timeout (regardless of activity)
 *
 * Calls `onTimeout` when either limit is reached.
 * Only active when `enabled` is true (i.e. user is authenticated).
 */
export function useSessionTimeout(onTimeout: () => void, enabled: boolean) {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const absoluteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (absoluteTimerRef.current) {
      clearTimeout(absoluteTimerRef.current);
      absoluteTimerRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(onTimeout, IDLE_TIMEOUT_MS);
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // --- Absolute timeout ---
    // Record session start time on first authentication.
    // If the page is reloaded, the stored timestamp persists so the
    // absolute limit is still enforced from the original login time.
    let sessionStart = Number(sessionStorage.getItem(SESSION_START_KEY));
    if (!sessionStart) {
      sessionStart = Date.now();
      sessionStorage.setItem(SESSION_START_KEY, String(sessionStart));
    }

    const elapsed = Date.now() - sessionStart;
    const remaining = ABSOLUTE_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      // Session already exceeded 8 hours (e.g. tab was left open)
      onTimeout();
      return;
    }

    absoluteTimerRef.current = setTimeout(onTimeout, remaining);

    // --- Idle timeout ---
    resetIdleTimer();

    const onActivity = () => resetIdleTimer();

    for (const event of USER_ACTIVITY_EVENTS) {
      document.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const event of USER_ACTIVITY_EVENTS) {
        document.removeEventListener(event, onActivity);
      }
    };
  }, [enabled, onTimeout, resetIdleTimer, clearTimers]);
}
