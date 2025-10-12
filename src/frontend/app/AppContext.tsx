/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type LngLatLike } from "maplibre-gl";

export type Theme = "light" | "dark" | "system";
type TableStyle = "regular" | "grouped";
type MapPositionMode = "gps" | "last";

interface MapState {
  center: LngLatLike;
  zoom: number;
  userLocation: LngLatLike | null;
  hasLocationPermission: boolean;
}

interface AppContextProps {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  toggleTheme: () => void;

  tableStyle: TableStyle;
  setTableStyle: React.Dispatch<React.SetStateAction<TableStyle>>;
  toggleTableStyle: () => void;

  mapState: MapState;
  setMapCenter: (center: LngLatLike) => void;
  setMapZoom: (zoom: number) => void;
  setUserLocation: (location: LngLatLike | null) => void;
  setLocationPermission: (hasPermission: boolean) => void;
  updateMapState: (center: LngLatLike, zoom: number) => void;

  mapPositionMode: MapPositionMode;
  setMapPositionMode: (mode: MapPositionMode) => void;
}

// Coordenadas por defecto centradas en Vigo
const DEFAULT_CENTER: LngLatLike = [42.229188855975046, -8.72246955783102];
const DEFAULT_ZOOM = 14;

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  //#region Theme
  const getPreferredScheme = () => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return "light" as const;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getPreferredScheme,
  );

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
      return savedTheme;
    }
    return "system";
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    // Sync immediately in case theme changed before subscription
    setSystemTheme(media.matches ? "dark" : "light");

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === "light") {
        return "dark";
      }
      if (prevTheme === "dark") {
        return "system";
      }
      return "light";
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);
  //#endregion

  //#region Table Style
  const [tableStyle, setTableStyle] = useState<TableStyle>(() => {
    const savedTableStyle = localStorage.getItem("tableStyle");
    if (savedTableStyle) {
      return savedTableStyle as TableStyle;
    }
    return "regular";
  });

  const toggleTableStyle = () => {
    setTableStyle((prevTableStyle) =>
      prevTableStyle === "regular" ? "grouped" : "regular",
    );
  };

  useEffect(() => {
    localStorage.setItem("tableStyle", tableStyle);
  }, [tableStyle]);
  //#endregion

  //#region Map Position Mode
  const [mapPositionMode, setMapPositionMode] = useState<MapPositionMode>(
    () => {
      const saved = localStorage.getItem("mapPositionMode");
      return saved === "last" ? "last" : "gps";
    },
  );

  useEffect(() => {
    localStorage.setItem("mapPositionMode", mapPositionMode);
  }, [mapPositionMode]);
  //#endregion

  //#region Map State
  const [mapState, setMapState] = useState<MapState>(() => {
    const savedMapState = localStorage.getItem("mapState");
    if (savedMapState) {
      try {
        const parsed = JSON.parse(savedMapState);
        return {
          center: parsed.center || DEFAULT_CENTER,
          zoom: parsed.zoom || DEFAULT_ZOOM,
          userLocation: parsed.userLocation || null,
          hasLocationPermission: parsed.hasLocationPermission || false,
        };
      } catch (e) {
        console.error("Error parsing saved map state", e);
      }
    }
    return {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      userLocation: null,
      hasLocationPermission: false,
    };
  });

  const setMapCenter = (center: LngLatLike) => {
    setMapState((prev) => {
      const newState = { ...prev, center };
      localStorage.setItem("mapState", JSON.stringify(newState));
      return newState;
    });
  };

  const setMapZoom = (zoom: number) => {
    setMapState((prev) => {
      const newState = { ...prev, zoom };
      localStorage.setItem("mapState", JSON.stringify(newState));
      return newState;
    });
  };

  const setUserLocation = (userLocation: LngLatLike | null) => {
    setMapState((prev) => {
      const newState = { ...prev, userLocation };
      localStorage.setItem("mapState", JSON.stringify(newState));
      return newState;
    });
  };

  const setLocationPermission = (hasLocationPermission: boolean) => {
    setMapState((prev) => {
      const newState = { ...prev, hasLocationPermission };
      localStorage.setItem("mapState", JSON.stringify(newState));
      return newState;
    });
  };

  const updateMapState = (center: LngLatLike, zoom: number) => {
    setMapState((prev) => {
      const newState = { ...prev, center, zoom };
      localStorage.setItem("mapState", JSON.stringify(newState));
      return newState;
    });
  };
  //#endregion

  // Tratar de obtener la ubicación del usuario cuando se carga la aplicación si ya se había concedido permiso antes
  useEffect(() => {
    if (mapState.hasLocationPermission && !mapState.userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
          },
          (error) => {
            console.error("Error getting location:", error);
            setLocationPermission(false);
          },
        );
      }
    }
  }, [mapState.hasLocationPermission, mapState.userLocation]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        tableStyle,
        setTableStyle,
        toggleTableStyle,
        mapState,
        setMapCenter,
        setMapZoom,
        setUserLocation,
        setLocationPermission,
        updateMapState,
        mapPositionMode,
        setMapPositionMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }
  return context;
};
