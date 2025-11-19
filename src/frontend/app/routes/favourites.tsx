import { useTranslation } from "react-i18next";
import { usePageTitle } from "~/contexts/PageTitleContext";

export default function Favourites() {
  const { t } = useTranslation();
  usePageTitle(t("navbar.favourites", "Favoritos"));

  return (
    <div className="page-container">
      <p>{t("favourites.empty", "No tienes paradas favoritas.")}</p>
    </div>
  );
}
