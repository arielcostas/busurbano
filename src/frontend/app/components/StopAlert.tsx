import React, { useMemo } from "react";
import { AlertCircle, AlertOctagon, Info, TriangleAlert } from "lucide-react";
import type { Stop } from "~/data/StopDataProvider";
import "./StopAlert.css";

interface StopAlertProps {
  stop: Stop;
  compact?: boolean;
}

export const StopAlert: React.FC<StopAlertProps> = ({
  stop,
  compact = false,
}) => {
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
<<<<<<< HEAD
    <div className={`stop-alert ${alertType} ${compact ? 'stop-alert-compact' : ''}`}>
      {alertIcon}
      <div className="stop-alert-content">
        {stop.title && <div className="stop-alert-title">{stop.title}</div>}
        {stop.message && <div className="stop-alert-message">{stop.message}</div>}
=======
    <div
      className={`stop-alert ${isError ? "stop-alert-error" : "stop-alert-info"} ${compact ? "stop-alert-compact" : ""}`}
    >
      <div className="stop-alert-icon">
        {isError ? <AlertCircle /> : <Info />}
      </div>
      <div className="stop-alert-content">
        {stop.title && <div className="stop-alert-title">{stop.title}</div>}
        {stop.message && (
          <div className="stop-alert-message">{stop.message}</div>
        )}
        {stop.alternateCodes && stop.alternateCodes.length > 0 && (
          <div className="stop-alert-alternate-codes">
            Alternative stops: {stop.alternateCodes.join(", ")}
          </div>
        )}
>>>>>>> 88e0621 (Improve gallery scroll indicators and format code)
      </div>
    </div>
  );
};
