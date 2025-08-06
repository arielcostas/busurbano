import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { swManager } from "../utils/serviceWorkerManager";
import "./UpdateNotification.css";

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    swManager.onUpdate(() => {
      setShowUpdate(true);
    });
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    swManager.activateUpdate();

    // Wait for the page to reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <div className="update-icon">
          <Download size={20} />
        </div>
        <div className="update-text">
          <div className="update-title">Nueva versión disponible</div>
          <div className="update-description">
            Actualiza para obtener las últimas mejoras
          </div>
        </div>
        <div className="update-actions">
          <button
            className="update-button"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            className="update-dismiss"
            onClick={handleDismiss}
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
