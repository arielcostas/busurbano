import { useApp } from "../AppContext";
import "./settings.css";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { swManager } from "../utils/serviceWorkerManager";
import { RotateCcw, Download } from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const {
    theme,
    setTheme,
    tableStyle,
    setTableStyle,
    mapPositionMode,
    setMapPositionMode,
  } = useApp();

  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    setUpdateMessage(null);

    try {
      // Check if service worker is supported
      if (!("serviceWorker" in navigator)) {
        setUpdateMessage(t("about.sw_not_supported", "Service Workers no son compatibles en este navegador"));
        return;
      }

      // Force check for updates
      await swManager.checkForUpdates();

      // Wait a moment for the update check to complete
      setTimeout(() => {
        if (swManager.isUpdateAvailable()) {
          setUpdateMessage(t("about.update_available", "¡Nueva versión disponible! Aparecerá una notificación para actualizar."));
        } else {
          setUpdateMessage(t("about.up_to_date", "Ya tienes la versión más reciente."));
        }
      }, 2000);

    } catch (error) {
      console.error("Error checking for updates:", error);
      setUpdateMessage(t("about.update_error", "Error al comprobar actualizaciones. Intenta recargar la página."));
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm(t("about.clear_cache_confirm", "¿Estás seguro de que quieres limpiar la caché? Esto eliminará todos los datos guardados localmente."))) {
      try {
        await swManager.clearCache();
        setUpdateMessage(t("about.cache_cleared", "Caché limpiada. La página se recargará para aplicar los cambios."));
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error clearing cache:", error);
        setUpdateMessage(t("about.cache_error", "Error al limpiar la caché."));
      }
    }
  };

  const handleResetPWA = async () => {
    if (confirm(t("about.reset_pwa_confirm", "¿Estás seguro? Esto eliminará TODOS los datos de la aplicación y la reiniciará completamente. Úsalo solo si hay problemas graves de caché."))) {
      try {
        await swManager.resetPWA();
      } catch (error) {
        console.error("Error resetting PWA:", error);
        setUpdateMessage(t("about.reset_pwa_error", "Error al reiniciar la PWA."));
      }
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">{t("about.title")}</h1>
      <p className="about-description">{t("about.description")}</p>
      <section className="settings-section">
        <h2>{t("about.settings")}</h2>
        <div className="settings-content-inline">
          <label htmlFor="theme" className="form-label-inline">
            {t("about.theme")}
          </label>
          <select
            id="theme"
            className="form-select-inline"
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark")}
          >
            <option value="light">{t("about.theme_light")}</option>
            <option value="dark">{t("about.theme_dark")}</option>
          </select>
        </div>
        <div className="settings-content-inline">
          <label htmlFor="tableStyle" className="form-label-inline">
            {t("about.table_style")}
          </label>
          <select
            id="tableStyle"
            className="form-select-inline"
            value={tableStyle}
            onChange={(e) =>
              setTableStyle(e.target.value as "regular" | "grouped")
            }
          >
            <option value="regular">{t("about.table_style_regular")}</option>
            <option value="grouped">{t("about.table_style_grouped")}</option>
          </select>
        </div>
        <div className="settings-content-inline">
          <label htmlFor="mapPositionMode" className="form-label-inline">
            {t("about.map_position_mode")}
          </label>
          <select
            id="mapPositionMode"
            className="form-select-inline"
            value={mapPositionMode}
            onChange={(e) =>
              setMapPositionMode(e.target.value as "gps" | "last")
            }
          >
            <option value="gps">{t("about.map_position_gps")}</option>
            <option value="last">{t("about.map_position_last")}</option>
          </select>
        </div>
        <div className="settings-content-inline">
          <label htmlFor="language" className="form-label-inline">
            {t("about.language", "Idioma")}:
          </label>
          <select
            id="language"
            className="form-select-inline"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="es-ES">Español</option>
            <option value="gl-ES">Galego</option>
            <option value="en-GB">English</option>
          </select>
        </div>
        <details className="form-details">
          <summary>{t("about.details_summary")}</summary>
          <p>{t("about.details_table")}</p>
          <dl>
            <dt>{t("about.table_style_regular")}</dt>
            <dd>{t("about.details_regular")}</dd>
            <dt>{t("about.table_style_grouped")}</dt>
            <dd>{t("about.details_grouped")}</dd>
          </dl>
        </details>

        <div className="settings-section">
          <h3>{t("about.app_updates", "Actualizaciones de la aplicación")}</h3>
          <div className="update-controls">
            <button
              className="update-button"
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdates}
            >
              {isCheckingUpdates ? (
                <>
                  <RotateCcw className="spinning" size={18} />
                  {t("about.checking_updates", "Comprobando...")}
                </>
              ) : (
                <>
                  <Download size={18} />
                  {t("about.check_updates", "Comprobar actualizaciones")}
                </>
              )}
            </button>

            <button
              className="clear-cache-button"
              onClick={handleClearCache}
            >
              <RotateCcw size={18} />
              {t("about.clear_cache", "Limpiar caché")}
            </button>

            <button
              className="reset-pwa-button"
              onClick={handleResetPWA}
            >
              <RotateCcw size={18} />
              {t("about.reset_pwa", "Reiniciar PWA (Nuclear)")}
            </button>
          </div>

          {updateMessage && (
            <div className={`update-message ${updateMessage.includes("Error") || updateMessage.includes("error") ? 'error' : 'success'}`}>
              {updateMessage}
            </div>
          )}

          <p className="update-help-text">
            {t("about.update_help", "Si tienes problemas con la aplicación o no ves las últimas funciones, usa estos botones para forzar una actualización o limpiar los datos guardados.")}
          </p>
        </div>
      </section>
      <h2>{t("about.credits")}</h2>
      <p>
        <a
          href="https://github.com/arielcostas/urbanovigo-web"
          className="about-link"
          rel="nofollow noreferrer noopener"
        >
          {t("about.github")}
        </a>{" "}
        -{t("about.developed_by")}{" "}
        <a
          href="https://www.costas.dev"
          className="about-link"
          rel="nofollow noreferrer noopener"
        >
          Ariel Costas
        </a>
      </p>
      <p>
        {t("about.data_source_prefix")}{" "}
        <a
          href="https://datos.vigo.org"
          className="about-link"
          rel="nofollow noreferrer noopener"
        >
          datos.vigo.org
        </a>{" "}
        {t("about.data_source_middle")}{" "}
        <a
          href="https://opendefinition.org/licenses/odc-by/"
          className="about-link"
          rel="nofollow noreferrer noopener"
        >
          Open Data Commons Attribution License
        </a>
      </p>
    </div>
  );
}
