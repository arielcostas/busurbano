import React, { useMemo } from "react";
import { AlertCircle, AlertOctagon, Info, TriangleAlert } from "lucide-react";
import type { Stop } from "~/data/StopDataProvider";
import "./StopAlert.css";

interface StopAlertProps {
  stop: Stop;
  compact?: boolean;
}

export const StopAlert: React.FC<StopAlertProps> = ({ stop, compact = false }) => {
  // Don't render anything if there's no alert content
  const hasContent = stop.title || stop.message;
  if (!hasContent) {
    return null;
  }

  const alertType = useMemo(() => {
    if (stop.alert === "error") return "stop-alert-error";
    if (stop.alert === "warning") return "stop-alert-warning";
    return "stop-alert-info";
  }, [stop.alert]);

  const alertIcon = useMemo(() => {
    if (stop.alert === "error") return <AlertOctagon />;
    if (stop.alert === "warning") return <TriangleAlert />;
    return <Info />;
  }, [stop.alert]);

  return (
    <div className={`stop-alert ${alertType} ${compact ? 'stop-alert-compact' : ''}`}>
      {alertIcon}
      <div className="stop-alert-content">
        {stop.title && <div className="stop-alert-title">{stop.title}</div>}
        {stop.message && <div className="stop-alert-message">{stop.message}</div>}
      </div>
    </div>
  );
};
