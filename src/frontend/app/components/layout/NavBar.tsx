import { Map, MapPin, Route, Settings } from "lucide-react";
import type { LngLatLike } from "maplibre-gl";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { useApp } from "../../AppContext";
import styles from "./NavBar.module.css";

// Helper: check if coordinates are within Vigo bounds
function isWithinVigo(lngLat: LngLatLike): boolean {
  let lng: number, lat: number;
  if (Array.isArray(lngLat)) {
    [lng, lat] = lngLat;
  } else if ("lng" in lngLat && "lat" in lngLat) {
    lng = lngLat.lng;
    lat = lngLat.lat;
  } else {
    return false;
  }
  // Rough bounding box for Vigo
  return lat >= 42.18 && lat <= 42.3 && lng >= -8.78 && lng <= -8.65;
}

interface NavBarProps {
  orientation?: "horizontal" | "vertical";
}

export default function NavBar({ orientation = "horizontal" }: NavBarProps) {
  const { t } = useTranslation();
  const { mapState, updateMapState, mapPositionMode } = useApp();
  const location = useLocation();

  const navItems = [
    {
      name: t("navbar.stops", "Paradas"),
      icon: MapPin,
      path: "/",
      exact: true,
    },
    {
      name: t("navbar.map", "Mapa"),
      icon: Map,
      path: "/map",
      callback: () => {
        if (mapPositionMode !== "gps") {
          return;
        }

        if (!("geolocation" in navigator)) {
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const coords: LngLatLike = [latitude, longitude];
            if (isWithinVigo(coords)) {
              updateMapState(coords, 16);
            }
          },
          () => { }
        );
      },
    },
    {
      name: t("navbar.lines", "Líneas"),
      icon: Route,
      path: "/lines",
    },
    {
      name: t("navbar.settings", "Ajustes"),
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <nav
      className={`${styles.navBar} ${orientation === "vertical" ? styles.vertical : ""
        }`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path);

        return (
          <Link
            key={item.name}
            to={item.path}
            className={`${styles.link} ${isActive ? styles.active : ""}`}
            onClick={item.callback ? item.callback : undefined}
            title={item.name}
            aria-label={item.name}
          >
            <Icon size={24} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
