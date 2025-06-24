/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type LngLatLike } from 'maplibre-gl';

type Theme = 'light' | 'dark';
type TableStyle = 'regular'|'grouped';
type MapPositionMode = 'gps' | 'last';

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
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme as Theme;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  //#endregion

  //#region Table Style
  const [tableStyle, setTableStyle] = useState<TableStyle>(() => {
    const savedTableStyle = localStorage.getItem('tableStyle');
    if (savedTableStyle) {
      return savedTableStyle as TableStyle;
    }
    return 'regular';
  });

  const toggleTableStyle = () => {
    setTableStyle((prevTableStyle) => (prevTableStyle === 'regular' ? 'grouped' : 'regular'));
  }

  useEffect(() => {
    localStorage.setItem('tableStyle', tableStyle);
  }, [tableStyle]);
  //#endregion

  //#region Map Position Mode
  const [mapPositionMode, setMapPositionMode] = useState<MapPositionMode>(() => {
    const saved = localStorage.getItem('mapPositionMode');
    return saved === 'last' ? 'last' : 'gps';
  });

  useEffect(() => {
    localStorage.setItem('mapPositionMode', mapPositionMode);
  }, [mapPositionMode]);
  //#endregion

  //#region Map State
  const [mapState, setMapState] = useState<MapState>(() => {
    const savedMapState = localStorage.getItem('mapState');
    if (savedMapState) {
      try {
        const parsed = JSON.parse(savedMapState);
        return {
          center: parsed.center || DEFAULT_CENTER,
          zoom: parsed.zoom || DEFAULT_ZOOM,
          userLocation: parsed.userLocation || null,
          hasLocationPermission: parsed.hasLocationPermission || false
        };
      } catch (e) {
        console.error('Error parsing saved map state', e);
      }
    }
    return {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      userLocation: null,
      hasLocationPermission: false
    };
  });

  // Helper: check if coordinates are within Vigo bounds
  function isWithinVigo(lngLat: LngLatLike): boolean {
    let lng: number, lat: number;
    if (Array.isArray(lngLat)) {
      [lng, lat] = lngLat;
    } else if ('lng' in lngLat && 'lat' in lngLat) {
      lng = lngLat.lng;
      lat = lngLat.lat;
    } else {
      return false;
    }
    // Rough bounding box for Vigo
    return lat >= 42.18 && lat <= 42.30 && lng >= -8.78 && lng <= -8.65;
  }

  // On app load, if mapPositionMode is 'gps', try to get GPS and set map center
  useEffect(() => {
    if (mapPositionMode === 'gps') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const coords: LngLatLike = [latitude, longitude];
            if (isWithinVigo(coords)) {
              setMapState(prev => {
                const newState = { ...prev, center: coords, zoom: 16, userLocation: coords };
                localStorage.setItem('mapState', JSON.stringify(newState));
                return newState;
              });
            }
          },
          () => {
            // Ignore error, fallback to last
          }
        );
      }
    }
    // If 'last', do nothing (already loaded from localStorage)
  }, [mapPositionMode]);

  const setMapCenter = (center: LngLatLike) => {
    setMapState(prev => {
      const newState = { ...prev, center };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };

  const setMapZoom = (zoom: number) => {
    setMapState(prev => {
      const newState = { ...prev, zoom };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };

  const setUserLocation = (userLocation: LngLatLike | null) => {
    setMapState(prev => {
      const newState = { ...prev, userLocation };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };

  const setLocationPermission = (hasLocationPermission: boolean) => {
    setMapState(prev => {
      const newState = { ...prev, hasLocationPermission };
      localStorage.setItem('mapState', JSON.stringify(newState));
      return newState;
    });
  };

  const updateMapState = (center: LngLatLike, zoom: number) => {
    setMapState(prev => {
      const newState = { ...prev, center, zoom };
      localStorage.setItem('mapState', JSON.stringify(newState));
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
            console.error('Error getting location:', error);
            setLocationPermission(false);
          }
        );
      }
    }
  }, [mapState.hasLocationPermission, mapState.userLocation]);

  return (
    <AppContext.Provider value={{
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
      setMapPositionMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
};
