import { Computer, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "~/contexts/PageTitleContext";
import { type Theme, useApp } from "../AppContext";
import "./settings.css";

export default function Settings() {
  const { t, i18n } = useTranslation();
  usePageTitle(t("navbar.settings", "Ajustes"));
  const {
    theme,
    setTheme,
    mapPositionMode,
    setMapPositionMode
  } = useApp();

  return (
    <div className="page-container">
      <section className="settings-section">
        <h2>{t("about.settings")}</h2>

        <div className="settings-content-inline">
          <label htmlFor="theme" className="form-label-inline">
            {t("about.theme")}
          </label>

          <div className="flex">
            <button onClick={() => setTheme("light")}>
              <Sun />
            </button>
            <button onClick={() => setTheme("dark")}>
              <Moon />
            </button>
            <button onClick={() => setTheme("system")}>
              <Computer />
            </button>
          </div>

          <select
            id="theme"
            className="form-select-inline"
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="light">{t("about.theme_light")}</option>
            <option value="dark">{t("about.theme_dark")}</option>
            <option value="system">{t("about.theme_system")}</option>
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

      </section>
    </div>
  );
}
