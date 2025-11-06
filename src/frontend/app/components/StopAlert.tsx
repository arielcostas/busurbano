import React from "react";
import { AlertCircle, Info } from "lucide-react";
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

  const isError = stop.cancelled === true;

  return (
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
      </div>
    </div>
  );
};
