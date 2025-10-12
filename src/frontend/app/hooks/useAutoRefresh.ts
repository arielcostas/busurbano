import { useEffect, useRef, useCallback } from "react";

interface UseAutoRefreshOptions {
  onRefresh: () => Promise<void>;
  interval?: number;
  enabled?: boolean;
}

export function useAutoRefresh({
  onRefresh,
  interval = 30000, // 30 seconds default
  enabled = true,
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshCallbackRef = useRef(onRefresh);

  // Update callback ref when it changes
  useEffect(() => {
    refreshCallbackRef.current = onRefresh;
  }, [onRefresh]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled) {
      intervalRef.current = setInterval(() => {
        refreshCallbackRef.current();
      }, interval);
    }
  }, [interval, enabled]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoRefresh();
    return stopAutoRefresh;
  }, [startAutoRefresh, stopAutoRefresh]);

  // Handle visibility change to pause/resume auto-refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoRefresh();
      } else {
        startAutoRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startAutoRefresh, stopAutoRefresh]);

  return { startAutoRefresh, stopAutoRefresh };
}
