import { useTranslation } from "react-i18next";
import { usePageTitle } from "~/contexts/PageTitleContext";
import { useApp } from "../AppContext";
import "./about.css";
import "./settings.css"; // Reusing settings CSS for now

export default function About() {
  const { t } = useTranslation();
  usePageTitle(t("about.title", "Acerca de"));
  const { region } = useApp();

  return (
    <div className="page-container">
      <p className="about-description">{t("about.description")}</p>

      <h2>{t("about.credits")}</h2>
      <p>
        <a
          href="https://github.com/arielcostas/busurbano"
          className="about-link"
          rel="nofollow noreferrer noopener"
        >
          {t("about.github")}
        </a>{" "}
        - {t("about.developed_by")}{" "}
        <a
          href="https://www.costas.dev"
          className="about-link"
          rel="nofollow noreferrer noopener"
        >
          Ariel Costas
        </a>
      </p>
      {region === "vigo" && (
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
          .
        </p>
      )}

      <div className="about-version">
        <small>Version: {__COMMIT_HASH__}</small>
      </div>
    </div>
  );
}
