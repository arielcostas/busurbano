import { type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import "./PullToRefresh.css";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
  children: ReactNode;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  canRefresh,
  children,
}: PullToRefreshIndicatorProps) {
  const opacity = Math.min(pullDistance / 60, 1);
  const rotation = isRefreshing ? 360 : pullDistance * 4;
  const scale = Math.min(0.5 + (pullDistance / 120), 1);

  return (
    <div className="pull-to-refresh-container">
      <div 
        className="pull-to-refresh-indicator"
        style={{
          transform: `translateY(${Math.min(pullDistance, 80)}px)`,
          opacity: opacity,
        }}
      >
        <div 
          className={`pull-to-refresh-icon ${isRefreshing ? 'spinning' : ''} ${canRefresh ? 'ready' : ''}`}
          style={{
            transform: `rotate(${rotation}deg) scale(${scale})`,
          }}
        >
          <RotateCcw size={24} />
        </div>
        <div className="pull-to-refresh-text">
          {isRefreshing ? "Actualizando..." : canRefresh ? "Suelta para actualizar" : "Arrastra para actualizar"}
        </div>
      </div>
      <div 
        className="pull-to-refresh-content"
        style={{
          transform: `translateY(${Math.min(pullDistance * 0.5, 40)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
