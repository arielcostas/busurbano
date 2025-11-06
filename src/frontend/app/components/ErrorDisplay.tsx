import React from "react";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./ErrorDisplay.css";

interface ErrorDisplayProps {
  error: {
    type: "network" | "server" | "unknown";
    status?: number;
    message?: string;
  };
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title,
  className = "",
}) => {
  const { t } = useTranslation();

  const getErrorIcon = () => {
    switch (error.type) {
      case "network":
        return <WifiOff className="error-icon" />;
      case "server":
        return <AlertTriangle className="error-icon" />;
      default:
        return <AlertTriangle className="error-icon" />;
    }
  };

  const getErrorMessage = () => {
    switch (error.type) {
      case "network":
        return t(
          "errors.network",
          "No hay conexión a internet. Comprueba tu conexión y vuelve a intentarlo.",
        );
      case "server":
        if (error.status === 404) {
          return t(
            "errors.not_found",
            "No se encontraron datos para esta parada.",
          );
        }
        if (error.status === 500) {
          return t(
            "errors.server_error",
            "Error del servidor. Inténtalo de nuevo más tarde.",
          );
        }
        if (error.status && error.status >= 400) {
          return t(
            "errors.client_error",
            "Error en la solicitud. Verifica que la parada existe.",
          );
        }
        return t("errors.server_generic", "Error del servidor ({{status}})", {
          status: error.status || "desconocido",
        });
      default:
        return (
          error.message ||
          t("errors.unknown", "Ha ocurrido un error inesperado.")
        );
    }
  };

  const getErrorTitle = () => {
    if (title) return title;

    switch (error.type) {
      case "network":
        return t("errors.network_title", "Sin conexión");
      case "server":
        return t("errors.server_title", "Error del servidor");
      default:
        return t("errors.unknown_title", "Error");
    }
  };

  return (
    <div className={`error-display ${className}`}>
      <div className="error-content">
        {getErrorIcon()}
        <h3 className="error-title">{getErrorTitle()}</h3>
        <p className="error-message">{getErrorMessage()}</p>
        {onRetry && (
          <button className="error-retry-button" onClick={onRetry}>
            <RefreshCw className="retry-icon" />
            {t("errors.retry", "Reintentar")}
          </button>
        )}
      </div>
    </div>
  );
};
