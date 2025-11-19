import React from "react";
import { useTranslation } from "react-i18next";
import "./ServiceAlerts.css";

const ServiceAlerts: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="service-alerts-container stoplist-section">
      <h2 className="page-subtitle">{t("stoplist.service_alerts")}</h2>
      <div className="service-alert info">
        <div className="alert-icon">ℹ️</div>
        <div className="alert-content">
          <div className="alert-title">{t("stoplist.alerts_coming_soon")}</div>
          <div className="alert-message">
            {t("stoplist.alerts_description")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAlerts;
