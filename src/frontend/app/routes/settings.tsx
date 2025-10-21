import { type Theme, useApp } from "../AppContext";
import "./settings.css";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { getAvailableRegions } from "../data/RegionConfig";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const {
    theme,
    setTheme,
    tableStyle,
    setTableStyle,
    mapPositionMode,
    setMapPositionMode,
    region,
    setRegion,
  } = useApp();

  const regions = getAvailableRegions();

  return (
    <div className="page-container">
      <h1 className="page-title">{t("about.title")}</h1>
      <p className="about-description">{t("about.description")}</p>
      <section className="settings-section">
        <h2>{t("about.settings")}</h2>
        <div className="settings-content-inline">
          <label htmlFor="region" className="form-label-inline">
            Región:
          </label>
          <select
            id="region"
            className="form-select-inline"
            value={region}
            onChange={(e) => setRegion(e.target.value as any)}
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-content-inline">
          <label htmlFor="theme" className="form-label-inline">
            {t("about.theme")}
          </label>
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
