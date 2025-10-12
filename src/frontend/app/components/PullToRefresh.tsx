import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import "./PullToRefresh.css";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isRefreshing = false,
  children,
  threshold = 60,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);

  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, threshold], [0, 1]);
  const scale = useTransform(y, [0, threshold], [0.5, 1]);
  const rotate = useTransform(y, [0, threshold], [0, 180]);

  const isAtPageTop = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    return scrollTop <= 10; // Increased tolerance to 10px
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Very strict check - must be at absolute top
    const windowScroll = window.pageYOffset || window.scrollY || 0;
    const htmlScroll = document.documentElement.scrollTop;
    const bodyScroll = document.body.scrollTop;
    const containerScroll = containerRef.current?.scrollTop || 0;
    const parentScroll = containerRef.current?.parentElement?.scrollTop || 0;
    const maxScroll = Math.max(windowScroll, htmlScroll, bodyScroll, containerScroll, parentScroll);

    if (maxScroll > 0 || isRefreshing) {
      setIsPulling(false);
      setIsActive(false);
      return;
    }

    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling) return;

    // Continuously check if we're still at the top during the gesture
    const windowScroll = window.pageYOffset || window.scrollY || 0;
    const htmlScroll = document.documentElement.scrollTop;
    const bodyScroll = document.body.scrollTop;
    const containerScroll = containerRef.current?.scrollTop || 0;
    const parentScroll = containerRef.current?.parentElement?.scrollTop || 0;
    const maxScroll = Math.max(windowScroll, htmlScroll, bodyScroll, containerScroll, parentScroll);

    if (maxScroll > 10) {
      // Cancel pull-to-refresh if we've scrolled away from top
      setIsPulling(false);
      setIsActive(false);
      y.set(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - startY.current;

    if (pullDistance > 0) {
      // Only prevent default when the event is cancelable
      if (e.cancelable) {
        e.preventDefault();
      }

      const dampedDistance = Math.min(pullDistance * 0.5, threshold * 1.2);
      y.set(dampedDistance);

      if (dampedDistance >= threshold && !isActive) {
        setIsActive(true);
        // Only vibrate if user activation is available and vibrate is supported
        if (navigator.vibrate && navigator.userActivation?.hasBeenActive) {
          navigator.vibrate(50);
        }
      } else if (dampedDistance < threshold && isActive) {
        setIsActive(false);
      }
    } else {
      // Reset if pulling up
      y.set(0);
      setIsActive(false);
    }
  }, [isPulling, threshold, isActive, y]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (isActive && y.get() >= threshold && !isRefreshing) {
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
    }

    // Always reset state
    setIsActive(false);
    y.set(0);
    startY.current = 0;
  }, [isPulling, isActive, threshold, isRefreshing, onRefresh, y]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false for touchmove to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className="pull-to-refresh-container" ref={containerRef}>
      {/* Simple indicator */}
      {isPulling && (
        <motion.div
          className="pull-to-refresh-indicator"
          style={{ opacity }}
        >
          <motion.div
            className={`refresh-icon-container ${isActive ? 'active' : ''}`}
            style={{ scale, rotate: isRefreshing ? 0 : rotate }}
          >
            <RefreshCw
              className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Normal content - no transform interference */}
      <div className="pull-to-refresh-content">
        {children}
      </div>
    </div>
  );
};
