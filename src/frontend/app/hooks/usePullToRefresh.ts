import { useEffect, useRef, useState } from "react";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: PullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isAtTop = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    let rafId: number;

    const checkScrollPosition = () => {
      isAtTop.current = container.scrollTop <= 5;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop.current || isRefreshing) return;
      
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || isRefreshing || !isAtTop.current) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging || isRefreshing) return;

      setIsDragging(false);
      
      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setPullDistance(0);
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkScrollPosition);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [enabled, isRefreshing, pullDistance, threshold, resistance, onRefresh, isDragging]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isDragging,
    canRefresh: pullDistance >= threshold,
  };
}
